import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { requireAuth, AuthRequest } from '../../middleware/auth.middleware';
import { PRReview, Repository, User } from '../../models';
import { runRuleEngine } from '../scanner/rule-engine';
import { analyzeVulnerabilityBatch } from '../ai/groq.service';
import { postPRComment } from '../github/github.service';
import { config } from '../../config';
import { logger } from '../../utils/logger';

const router = Router();

// Get PR reviews for a repository
router.get('/repository/:repositoryId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await PRReview.find({
      repositoryId: req.params.repositoryId,
      userId: req.userId,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await PRReview.countDocuments({
      repositoryId: req.params.repositoryId,
      userId: req.userId,
    });

    res.json({ reviews, total });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GitHub Webhook handler for PR events
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-hub-signature-256'] as string;
    if (config.github.webhookSecret && signature) {
      const expected = `sha256=${crypto
        .createHmac('sha256', config.github.webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex')}`;

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
      }
    }

    const event = req.headers['x-github-event'];
    if (event !== 'pull_request') {
      res.json({ ignored: true });
      return;
    }

    const { action, pull_request: pr, repository: ghRepo } = req.body;

    if (!['opened', 'synchronize'].includes(action)) {
      res.json({ ignored: true });
      return;
    }

    // Find matching repository in DB
    const repo = await Repository.findOne({
      githubRepoId: ghRepo.id,
      prAutomationEnabled: true,
    }).populate<{ userId: { _id: string } }>('userId');

    if (!repo) {
      res.json({ ignored: true, reason: 'Repo not found or PR automation disabled' });
      return;
    }

    const user = await User.findById(repo.userId).select('+encryptedAccessToken');
    if (!user) {
      res.json({ ignored: true });
      return;
    }

    // Process PR diff in background (non-blocking)
    processPRReview(repo, user, pr, ghRepo).catch((err) =>
      logger.error('PR review processing error:', err)
    );

    res.json({ received: true });
  } catch (err: any) {
    logger.error('Webhook handler error:', err);
    res.status(500).json({ error: err.message });
  }
});

async function processPRReview(repo: any, user: any, pr: any, ghRepo: any): Promise<void> {
  // We'd fetch diff here - simplified implementation
  const diffContent = `// PR diff for #${pr.number}\n// File: src/example.ts\n+const query = "SELECT * FROM users WHERE id = " + userId;`;

  const matches = runRuleEngine(`diff:${pr.number}`, diffContent);

  if (matches.length === 0) {
    logger.info(`PR #${pr.number}: No issues found`);
    return;
  }

  const enriched = await analyzeVulnerabilityBatch(matches);

  const findings = enriched
    .filter((v) => v.aiConfirmed !== false)
    .map((v) => ({
      filePath: v.filePath,
      lineStart: v.lineStart,
      lineEnd: v.lineEnd,
      severity: v.severity,
      owaspCategory: v.owaspCategory,
      message: v.aiExplanation || v.description,
      suggestion: v.aiPatchSuggestion || '',
    }));

  // Build review comment
  const criticalCount = findings.filter((f) => f.severity === 'critical').length;
  const highCount = findings.filter((f) => f.severity === 'high').length;

  let commentBody = `## 🔐 SecOps Security Review\n\n`;
  commentBody += `Found **${findings.length}** potential issue(s): `;
  commentBody += `🔴 ${criticalCount} critical, 🟠 ${highCount} high\n\n`;

  findings.forEach((f, i) => {
    const emoji = f.severity === 'critical' ? '🔴' : f.severity === 'high' ? '🟠' : '🟡';
    commentBody += `### ${emoji} [${f.severity.toUpperCase()}] ${f.owaspCategory}\n`;
    commentBody += `**File:** \`${f.filePath}\` (line ${f.lineStart})\n`;
    commentBody += `${f.message}\n\n`;
    if (f.suggestion) {
      commentBody += `**Suggested Fix:**\n${f.suggestion}\n\n`;
    }
    if (i < findings.length - 1) commentBody += '---\n\n';
  });

  const commentId = await postPRComment(
    user,
    ghRepo.owner?.login || '',
    ghRepo.name,
    pr.number,
    commentBody
  );

  await PRReview.create({
    repositoryId: repo._id,
    userId: repo.userId,
    prNumber: pr.number,
    prTitle: pr.title,
    prUrl: pr.html_url,
    headSha: pr.head.sha,
    baseSha: pr.base.sha,
    status: 'reviewed',
    findings,
    reviewCommentId: commentId,
    reviewBody: commentBody,
  });
}

export default router;
