import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../../config/database';
import { scanQueue } from './scan.queue';
import { executeScan, ScanJobPayload } from '../scanner/scanner.service';
import { logger } from '../../utils/logger';
import { config } from '../../config';

const CONCURRENCY = config.limits.maxConcurrentScansPerTeam;

export async function startWorker(): Promise<void> {
  await connectDB();

  logger.info(`[Worker] Starting scan worker with concurrency: ${CONCURRENCY}`);

  scanQueue.process('scan', CONCURRENCY, async (job) => {
    const payload: ScanJobPayload = job.data;
    logger.info(`[Worker] Processing scan job ${job.id} for repo: ${payload.owner}/${payload.repoName}`);

    await job.progress(10);
    await executeScan(payload);
    await job.progress(100);
  });

  scanQueue.on('completed', (job) => {
    logger.info(`[Worker] Job ${job.id} completed`);
  });

  scanQueue.on('failed', (job, err) => {
    logger.error(`[Worker] Job ${job.id} failed:`, err.message);
  });

  scanQueue.on('stalled', (job) => {
    logger.warn(`[Worker] Job ${job.id} stalled`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('[Worker] Shutting down...');
    await scanQueue.close();
    process.exit(0);
  });
}

// Only auto-start when this file is the entry point (npm run worker),
// NOT when imported by the main server process.
if (require.main === module) {
  startWorker().catch((err) => {
    logger.error('[Worker] Fatal error:', err);
    process.exit(1);
  });
}
