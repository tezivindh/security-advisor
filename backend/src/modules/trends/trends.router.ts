import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { requireAuth, AuthRequest } from '../../middleware/auth.middleware';
import { TrendSnapshot } from '../../models';

const router = Router();

// Get 30-day trend for a repository
router.get('/repository/:repositoryId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const snapshots = await TrendSnapshot.find({
      repositoryId: req.params.repositoryId,
      userId: req.userId,
      snapshotAt: { $gte: thirtyDaysAgo },
    })
      .sort({ snapshotAt: 1 })
      .limit(30);

    // Calculate improvement
    let improvementPercent: number | null = null;
    if (snapshots.length >= 2) {
      const first = snapshots[0].securityScore;
      const last = snapshots[snapshots.length - 1].securityScore;
      improvementPercent = Math.round(((last - first) / (first || 1)) * 100);
    }

    // Detect recurrent vulnerability rules (simplified)
    const recurrentRules: string[] = [];

    const trendData = snapshots.map((s) => ({
      date: s.snapshotAt,
      score: s.securityScore,
      critical: s.vulnerabilityCounts.critical,
      high: s.vulnerabilityCounts.high,
      medium: s.vulnerabilityCounts.medium,
      low: s.vulnerabilityCounts.low,
    }));

    res.json({
      trendData,
      improvementPercent,
      recurrentRules,
      latestScore: snapshots.at(-1)?.securityScore ?? null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Global trend across all repositories
router.get('/global', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const agg = await TrendSnapshot.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.userId!),
          snapshotAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$snapshotAt' } },
          avgScore: { $avg: '$securityScore' },
          totalCritical: { $sum: '$vulnerabilityCounts.critical' },
          totalHigh: { $sum: '$vulnerabilityCounts.high' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ trendData: agg });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
