import { env } from './config/env.js';
import { connectDb, disconnectDb } from './config/db.js';
import { createApp } from './app.js';
import { logger } from './shared/utils/logger.js';

const SHUTDOWN_TIMEOUT_MS = 10000;

async function start() {
  await connectDb();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info('server.started', { port: env.PORT, environment: env.NODE_ENV });
  });

  const shutdown = (signal) => {
    logger.info('server.shutdown_started', { signal });
    const forceExit = setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();
    server.close(async () => {
      await disconnectDb();
      logger.info('server.stopped');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => {
  logger.error('process.unhandled_rejection', { err: reason });
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('process.uncaught_exception', { err });
  process.exit(1);
});

start().catch((err) => {
  logger.error('server.start_failed', { err });
  process.exit(1);
});
