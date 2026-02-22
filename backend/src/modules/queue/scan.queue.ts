import Bull from 'bull';
import { config } from '../../config';
import { ScanJobPayload } from '../scanner/scanner.service';

export const scanQueue = new Bull<ScanJobPayload>('scan-queue', config.redisUrl, {
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
  settings: {
    maxStalledCount: 1,
  },
});

scanQueue.on('error', (error) => {
  console.error('[Queue] Bull error:', error);
});

export default scanQueue;
