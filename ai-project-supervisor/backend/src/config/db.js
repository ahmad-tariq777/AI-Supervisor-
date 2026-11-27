import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../shared/utils/logger.js';

const STATE_NAMES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

mongoose.set('strictQuery', true);

mongoose.connection.on('connected', () => logger.info('db.connected'));
mongoose.connection.on('disconnected', () => logger.warn('db.disconnected'));
mongoose.connection.on('error', (err) => logger.error('db.error', { err }));

export async function connectDb() {
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10
  });
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export async function dbStatus() {
  const state = STATE_NAMES[mongoose.connection.readyState] ?? 'unknown';
  if (mongoose.connection.readyState !== 1) {
    return { connected: false, state };
  }
  try {
    await mongoose.connection.db.admin().ping();
    return { connected: true, state };
  } catch (err) {
    logger.warn('db.ping_failed', { err });
    return { connected: false, state: 'unreachable' };
  }
}
