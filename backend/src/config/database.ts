import mongoose from 'mongoose';
import { config } from '../config';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
  } catch (err) {
    logger.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
};
