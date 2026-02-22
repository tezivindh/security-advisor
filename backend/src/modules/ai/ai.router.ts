import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { analyzeDemoSnippet } from './groq.service';

const router = Router();

const demoLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many demo requests. Please try again in a minute.' },
});

// Public demo endpoint
router.post('/demo/analyze', demoLimiter, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'code is required' });
      return;
    }

    if (code.length > 5000) {
      res.status(400).json({ error: 'Code snippet too large (max 5000 characters)' });
      return;
    }

    const result = await analyzeDemoSnippet(code);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
