import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../../middleware/auth.middleware';
import { Scan, Vulnerability, Repository } from '../../models';
import { scanQueue } from '../queue/scan.queue';
import mongoose from 'mongoose';

const router = Router();

// Trigger a manual scan
router.post('/trigger', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { repositoryId } = req.body;

    if (!repositoryId || !mongoose.Types.ObjectId.isValid(repositoryId)) {
      res.status(400).json({ error: 'Invalid or missing repositoryId' });
      return;
    }

    const repo = await Repository.findOne({ _id: repositoryId, userId: req.userId });
    if (!repo) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    const scan = await Scan.create({
      repositoryId: repo._id,
      userId: req.userId,
      trigger: 'manual',
      status: 'queued',
      branch: repo.defaultBranch,
    });

    // Queue the scan job
    await scanQueue.add(
      'scan',
      {
        scanId: scan._id.toString(),
        repositoryId: repo._id.toString(),
        userId: req.userId!,
        owner: repo.owner,
        repoName: repo.name,
        branch: repo.defaultBranch,
      },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    res.status(202).json({ scan, message: 'Scan queued successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get latest completed scan for a repo by fullName (owner/repo)
router.get('/repository/by-fullname/:owner/:repoName', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const fullName = `${req.params.owner}/${req.params.repoName}`;
    const dbRepo = await Repository.findOne({ userId: req.userId, fullName });
    if (!dbRepo) {
      res.status(404).json({ error: 'Repository not tracked' });
      return;
    }
    const scan = await Scan.findOne({
      repositoryId: dbRepo._id,
      userId: req.userId,
      status: 'completed',
    }).sort({ createdAt: -1 });

    res.json({ scan: scan || null, repositoryId: dbRepo._id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard summary (MUST be before /:scanId to avoid param capture)
router.get('/dashboard/summary', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId!);

    const [latestScans, severityCounts, owaspAgg] = await Promise.all([
      Scan.find({ userId, status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('repositoryId', 'fullName'),

      Vulnerability.aggregate([
        { $match: { userId } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),

      Vulnerability.aggregate([
        { $match: { userId } },
        { $group: { _id: '$owaspId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const avgScore =
      latestScans.length > 0
        ? Math.round(latestScans.reduce((s, sc) => s + sc.securityScore, 0) / latestScans.length)
        : 100;

    const severityMap = severityCounts.reduce((acc: any, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {});

    res.json({
      globalScore: avgScore,
      recentScans: latestScans,
      severityBreakdown: {
        critical: severityMap.critical || 0,
        high: severityMap.high || 0,
        medium: severityMap.medium || 0,
        low: severityMap.low || 0,
      },
      owaspDistribution: owaspAgg,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get scan status
router.get('/:scanId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const scan = await Scan.findOne({ _id: req.params.scanId, userId: req.userId });
    if (!scan) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }
    res.json({ scan });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get scans for a repository
router.get('/repository/:repositoryId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const scans = await Scan.find({
      repositoryId: req.params.repositoryId,
      userId: req.userId,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Scan.countDocuments({
      repositoryId: req.params.repositoryId,
      userId: req.userId,
    });

    res.json({ scans, total, page: Number(page), limit: Number(limit) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get vulnerabilities for a scan
router.get('/:scanId/vulnerabilities', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { severity, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = { scanId: req.params.scanId, userId: req.userId };
    if (severity) filter.severity = severity;

    const vulns = await Vulnerability.find(filter)
      .sort({ severity: 1, lineStart: 1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Vulnerability.countDocuments(filter);

    res.json({ vulnerabilities: vulns, total });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
