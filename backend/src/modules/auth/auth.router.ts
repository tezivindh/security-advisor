import { Router, Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

// Initiate GitHub OAuth
router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email', 'repo', 'read:org'] })
);

// GitHub OAuth callback
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: `${config.frontendUrl}/login?error=oauth_failed` }),
  (req: Request, res: Response) => {
    const user = req.user as any;

    const token = jwt.sign(
      { userId: user._id.toString(), login: user.login },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as any }
    );

    res.redirect(`${config.frontendUrl}/auth/callback?token=${token}`);
  }
);

// Get current user
router.get('/me', requireAuth, (req: Request, res: Response) => {
  const user = req.user as any;
  res.json({
    id: user._id,
    login: user.login,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    plan: user.plan,
  });
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  req.logout(() => {
    res.json({ success: true });
  });
});

export default router;
