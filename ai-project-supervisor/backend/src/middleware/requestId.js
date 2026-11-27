import { randomUUID } from 'node:crypto';
import { logger } from '../shared/utils/logger.js';

const VALID_ID = /^[A-Za-z0-9._-]{8,64}$/;

export function requestId(req, res, next) {
  const incoming = req.get('x-request-id');
  req.id = incoming && VALID_ID.test(incoming) ? incoming : randomUUID();
  req.log = logger.child({ requestId: req.id });
  res.setHeader('X-Request-Id', req.id);

  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    req.log.info('request.completed', {
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100
    });
  });

  next();
}
