import { AppError } from '../shared/errors/AppError.js';
import { ErrorCodes } from '../shared/errors/errorCodes.js';
import { logger } from '../shared/utils/logger.js';

function normalize(err) {
  if (err instanceof AppError) return err;
  if (err?.type === 'entity.parse.failed') {
    return new AppError(ErrorCodes.VALIDATION_ERROR, 'Request body is not valid JSON', {
      cause: err
    });
  }
  if (err?.type === 'entity.too.large') {
    return new AppError(ErrorCodes.PAYLOAD_TOO_LARGE, 'Request body is too large', {
      cause: err
    });
  }
  return new AppError(ErrorCodes.INTERNAL_ERROR, 'Something went wrong', { cause: err });
}

export function notFoundHandler(req, res, next) {
  next(new AppError(ErrorCodes.NOT_FOUND, `Route ${req.method} ${req.path} was not found`));
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const log = req.log ?? logger;
  const appError = normalize(err);

  if (appError.status >= 500) {
    log.error('request.failed', {
      err: appError,
      code: appError.code,
      status: appError.status,
      method: req.method,
      path: req.originalUrl?.split('?')[0]
    });
  } else {
    log.warn('request.rejected', {
      code: appError.code,
      status: appError.status,
      method: req.method,
      path: req.originalUrl?.split('?')[0]
    });
  }

  return res.status(appError.status).json({
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details,
      requestId: req.id
    }
  });
}
