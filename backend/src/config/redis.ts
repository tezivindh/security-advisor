import IORedis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

let redisClient: IORedis | null = null;

export const getRedisClient = (): IORedis => {
  if (!redisClient) {
    redisClient = new IORedis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('error', (err) => logger.error('Redis error:', err));
    redisClient.on('close', () => logger.warn('Redis connection closed'));
  }
  return redisClient;
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};
