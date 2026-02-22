import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import session from 'express-session';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { connectDB } from './config/database';
import { getRedisClient } from './config/redis';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Passport config (must be imported before routers)
import './modules/auth/passport.config';
import passport from 'passport';

// Routers
import authRouter from './modules/auth/auth.router';
import githubRouter from './modules/github/github.router';
import scannerRouter from './modules/scanner/scanner.router';
import aiRouter from './modules/ai/ai.router';
import prRouter from './modules/pr/pr.router';
import liveScanRouter from './modules/liveScan/liveScan.router';
import teamRouter from './modules/team/team.router';
import trendsRouter from './modules/trends/trends.router';

const app = express();

// Trust reverse proxy (Render, Vercel, etc.)
app.set('trust proxy', 1);

// ─── Security & Parsing ────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for API
    crossOriginEmbedderPolicy: false,
  })
);

const allowedOrigins = [
  config.frontendUrl,
  'https://security-advisor.vercel.app',
  /^https:\/\/security-advisor.*\.vercel\.app$/,
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Render health checks)
      if (!origin) return callback(null, true);
      const allowed = allowedOrigins.some((o) =>
        o instanceof RegExp ? o.test(origin) : o === origin
      );
      callback(allowed ? null : new Error(`CORS: origin ${origin} not allowed`), allowed);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ───────────────────────────────────────────────
if (config.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

// ─── Rate Limiting ─────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', globalLimiter);

// ─── Session (for Passport OAuth) ─────────────────────────
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: !config.isDev,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ─── Health Check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: config.nodeEnv });
});

// ─── API Routes ────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/github', githubRouter);
app.use('/api/scans', scannerRouter);
app.use('/api/ai', aiRouter);
app.use('/api/pr', prRouter);
app.use('/api/live-scan', liveScanRouter);
app.use('/api/teams', teamRouter);
app.use('/api/trends', trendsRouter);

// ─── 404 & Error Handlers ──────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Bootstrap ─────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  await connectDB();
  getRedisClient(); // Warm up Redis connection

  const server = app.listen(config.port, () => {
    logger.info(`🚀 SecOps API running on port ${config.port} [${config.nodeEnv}]`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      const { closeRedis } = await import('./config/redis');
      await closeRedis();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason);
  });
}

bootstrap();

export default app;
