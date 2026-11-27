import express from 'express';
import { requestId } from './middleware/requestId.js';
import { securityMiddleware } from './middleware/security.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.use(requestId);
  app.use(securityMiddleware);
  app.use('/api/v1', apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
