import path from 'path';
import fs from 'fs/promises';
import simpleGit from 'simple-git';
import { dir } from 'tmp-promise';
import mongoose from 'mongoose';
import { Scan, Vulnerability, Repository, TrendSnapshot, ActivityLog } from '../../models';
import { indexRepository } from './file-indexer';
import { runRuleEngine, RuleMatch } from './rule-engine';
import {
  calculateSecurityScore,
  countBySeverity,
  buildOwaspDistribution,
} from './score-calculator';
import { analyzeVulnerabilityBatch } from '../ai/groq.service';
import { getCloneUrl } from '../github/github.service';
import { logger } from '../../utils/logger';
import { IUser } from '../../models/User';

export interface ScanJobPayload {
  scanId: string;
  repositoryId: string;
  userId: string;
  teamId?: string;
  owner: string;
  repoName: string;
  branch: string;
}

export async function executeScan(payload: ScanJobPayload): Promise<void> {
  const { scanId, repositoryId, userId, teamId, owner, repoName, branch } = payload;
  const startedAt = new Date();
  let tmpDir: string | undefined;

  // Mark scan as running
  await Scan.findByIdAndUpdate(scanId, { status: 'running', startedAt });

  try {
    // Fetch user to get GitHub token
    const User = mongoose.model('User');
    const user = (await User.findById(userId).select('+encryptedAccessToken')) as IUser;
    if (!user) throw new Error('User not found');

    // 1. Clone repo to temp directory
    const { path: tmpPath, cleanup } = await dir({ unsafeCleanup: true });
    tmpDir = tmpPath;

    const cloneUrl = getCloneUrl(user, `${owner}/${repoName}`);
    const git = simpleGit();

    logger.info(`Cloning ${owner}/${repoName} into ${tmpPath}`);
    await git.clone(cloneUrl, tmpPath, ['--depth', '1', '--branch', branch]);

    // 2. Index repository files
    const files = await indexRepository(tmpPath);

    // 3. Run rule engine on all files
    const allMatches: RuleMatch[] = [];
    for (const file of files) {
      const matches = runRuleEngine(file.relativePath, file.content);
      allMatches.push(...matches);
    }

    logger.info(`Rule engine found ${allMatches.length} potential vulnerabilities`);

    // 4. Send suspicious blocks to Groq AI (batched, rate-limited)
    const aiEnriched = await analyzeVulnerabilityBatch(allMatches);

    // 5. Compute security score
    const severities = aiEnriched.map((v) => v.severity);
    const counts = countBySeverity(severities);
    const score = calculateSecurityScore(counts);
    const owaspDist = buildOwaspDistribution(aiEnriched.map((v) => v.owaspId));

    // 6. Save vulnerabilities to DB
    const vulnDocs = aiEnriched.map((v) => ({
      scanId: new mongoose.Types.ObjectId(scanId),
      repositoryId: new mongoose.Types.ObjectId(repositoryId),
      userId: new mongoose.Types.ObjectId(userId),
      teamId: teamId ? new mongoose.Types.ObjectId(teamId) : undefined,
      ruleId: v.ruleId,
      title: v.title,
      description: v.description,
      severity: v.severity,
      owaspCategory: v.owaspCategory,
      owaspId: v.owaspId,
      filePath: v.filePath,
      lineStart: v.lineStart,
      lineEnd: v.lineEnd,
      codeSnippet: v.codeSnippet,
      aiConfirmed: v.aiConfirmed,
      aiExplanation: v.aiExplanation,
      aiPatchSuggestion: v.aiPatchSuggestion,
      aiImpactSummary: v.aiImpactSummary,
    }));

    await Vulnerability.insertMany(vulnDocs);

    // 7. Update scan as completed
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    await Scan.findByIdAndUpdate(scanId, {
      status: 'completed',
      securityScore: score,
      totalFiles: files.length,
      scannedFiles: files.length,
      vulnerabilityCounts: counts,
      owaspDistribution: owaspDist,
      completedAt,
      durationMs,
    });

    // 8. Update repository last scan info
    await Repository.findByIdAndUpdate(repositoryId, {
      lastScanId: scanId,
      lastScanScore: score,
      lastScanAt: completedAt,
    });

    // 9. Save trend snapshot
    await TrendSnapshot.create({
      repositoryId,
      userId,
      teamId,
      scanId,
      securityScore: score,
      vulnerabilityCounts: counts,
      owaspDistribution: owaspDist,
      snapshotAt: completedAt,
    });

    // 10. Log activity
    await ActivityLog.create({
      userId,
      teamId,
      action: 'scan_completed',
      resourceType: 'scan',
      resourceId: scanId,
      metadata: { score, vulnCount: aiEnriched.length },
    });

    logger.info(`Scan ${scanId} completed. Score: ${score}, Vulns: ${aiEnriched.length}`);

    // 11. Clean up cloned repo
    if (cleanup) await cleanup();
  } catch (err: any) {
    logger.error(`Scan ${scanId} failed:`, err);

    await Scan.findByIdAndUpdate(scanId, {
      status: 'failed',
      errorMessage: err.message,
      completedAt: new Date(),
    });

    // Attempt cleanup
    if (tmpDir) {
      try {
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch {}
    }

    throw err;
  }
}
