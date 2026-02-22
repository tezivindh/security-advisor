import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../../middleware/auth.middleware';
import { listUserRepos } from './github.service';
import { Repository } from '../../models';

const router = Router();

// List GitHub repos for authenticated user
router.get('/repos', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const repos = await listUserRepos(req.user);

    // Enrich with scan status from DB
    const repoIds = repos.map((r) => r.id);
    const dbRepos = await Repository.find({
      userId: req.userId,
      githubRepoId: { $in: repoIds },
    }).select('githubRepoId scanningEnabled lastScanScore lastScanAt prAutomationEnabled');

    const dbMap = new Map(dbRepos.map((r) => [r.githubRepoId, r]));

    const enriched = repos.map((repo) => {
      const dbRepo = dbMap.get(repo.id);
      return {
        ...repo,
        _id: dbRepo?._id?.toString() ?? null,
        scanningEnabled: dbRepo?.scanningEnabled ?? false,
        lastScanScore: dbRepo?.lastScanScore ?? null,
        lastScanAt: dbRepo?.lastScanAt ?? null,
        prAutomationEnabled: dbRepo?.prAutomationEnabled ?? false,
        tracked: !!dbRepo,
      };
    });

    res.json({ repos: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Enable/disable scanning for a repo
router.post('/repos/:repoId/toggle', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { repoId } = req.params;
    const { enabled, fullName, name, owner, defaultBranch, language, htmlUrl, isPrivate } =
      req.body;

    const repo = await Repository.findOneAndUpdate(
      { userId: req.userId, githubRepoId: parseInt(repoId, 10) },
      {
        $set: {
          scanningEnabled: enabled,
          fullName,
          name,
          owner,
          defaultBranch,
          language: language || '',
          htmlUrl,
          private: isPrivate,
          userId: req.userId,
          githubRepoId: parseInt(repoId, 10),
        },
      },
      { upsert: true, new: true }
    );

    res.json({ repo });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
