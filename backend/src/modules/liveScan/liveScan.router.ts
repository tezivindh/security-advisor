import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../../middleware/auth.middleware';
import { performLiveScan } from './liveScan.service';
import rateLimit from 'express-rate-limit';

const router = Router();

const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many live scan requests. Please wait a minute.' },
});

// Trigger a live scan (requires domain verification acknowledgment)
router.post('/scan', requireAuth, scanLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { url, domainVerified } = req.body;

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'url is required' });
      return;
    }

    if (!domainVerified) {
      res
        .status(400)
        .json({ error: 'Domain ownership verification is required before scanning' });
      return;
    }

    // Validate URL is http/https only
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      res.status(400).json({ error: 'Only HTTP/HTTPS URLs are allowed' });
      return;
    }

    // Block localhost/internal IP scanning
    const hostname = parsed.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      res.status(400).json({ error: 'Internal/private network scanning is not allowed' });
      return;
    }

    const result = await performLiveScan(url);
    res.json(result);
  } catch (err: any) {
    if (err.message === 'Invalid URL provided') {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
