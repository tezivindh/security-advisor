import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../../middleware/auth.middleware';
import { Team, TeamMember, ActivityLog } from '../../models';
import mongoose from 'mongoose';

const router = Router();

// Create a team
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 50);
    const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

    const team = await Team.create({
      name,
      slug: uniqueSlug,
      ownerId: req.userId,
    });

    // Add owner as member
    await TeamMember.create({
      teamId: team._id,
      userId: req.userId,
      role: 'owner',
      invitedByUserId: req.userId,
    });

    await ActivityLog.create({
      userId: req.userId,
      teamId: team._id,
      action: 'team_created',
      resourceType: 'team',
      resourceId: team._id.toString(),
    });

    res.status(201).json({ team });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get my teams
router.get('/mine', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const memberships = await TeamMember.find({ userId: req.userId }).populate('teamId');
    const teams = memberships
      .filter((m) => m.teamId) // guard against orphaned memberships
      .map((m) => ({
        ...(m.teamId as any).toObject(),
        role: m.role,
      }));
    res.json({ teams });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Invite member to team
router.post('/:teamId/invite', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { teamId } = req.params;
    const { userId: inviteeId, role = 'developer' } = req.body;

    // Verify requester is owner
    const membership = await TeamMember.findOne({
      teamId,
      userId: req.userId,
      role: 'owner',
    });

    if (!membership) {
      res.status(403).json({ error: 'Only owners can invite members' });
      return;
    }

    const newMember = await TeamMember.create({
      teamId,
      userId: inviteeId,
      role,
      invitedByUserId: req.userId,
    });

    await ActivityLog.create({
      userId: req.userId,
      teamId,
      action: 'member_invited',
      resourceType: 'team',
      resourceId: teamId,
      metadata: { inviteeId, role },
    });

    res.status(201).json({ member: newMember });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ error: 'User is already a member of this team' });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

// Get team members
router.get('/:teamId/members', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const members = await TeamMember.find({ teamId: req.params.teamId }).populate(
      'userId',
      'login name avatarUrl email'
    );
    res.json({ members });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get team activity
const ACTION_LABEL: Record<string, string> = {
  scan_completed: 'Completed a security scan',
  scan_failed: 'A security scan failed',
  team_created: 'Created the team',
  member_invited: 'Invited a new member',
  member_role_updated: 'Updated a member role',
  pr_reviewed: 'AI reviewed a pull request',
  repo_enabled: 'Enabled repository scanning',
  repo_disabled: 'Disabled repository scanning',
};

router.get('/:teamId/activity', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 20 } = req.query;
    const rawLogs = await ActivityLog.find({ teamId: req.params.teamId })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('userId', 'login avatarUrl');

    const logs = rawLogs.map((l) => ({
      ...l.toObject(),
      description:
        ACTION_LABEL[l.action] ??
        l.action
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
    }));

    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update member role
router.patch('/:teamId/members/:memberId/role', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;

    // Verify requester is owner
    const ownerMembership = await TeamMember.findOne({
      teamId: req.params.teamId,
      userId: req.userId,
      role: 'owner',
    });

    if (!ownerMembership) {
      res.status(403).json({ error: 'Only owners can change roles' });
      return;
    }

    const updated = await TeamMember.findByIdAndUpdate(
      req.params.memberId,
      { role },
      { new: true }
    );

    res.json({ member: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
