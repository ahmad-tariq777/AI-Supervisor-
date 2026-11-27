import { ErrorCodes, ErrorStatus } from './errorCodes.js';

export class AppError extends Error {
  constructor(code, message, { details, cause } = {}) {
    super(message ?? code, cause ? { cause } : undefined);
    this.name = 'AppError';
    this.code = code;
    this.status = ErrorStatus[code] ?? 500;
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }

  static validation(message, details) {
    return new AppError(ErrorCodes.VALIDATION_ERROR, message, { details });
  }

  static notFound(message = 'Resource not found') {
    return new AppError(ErrorCodes.NOT_FOUND, message);
  }

  static forbidden(message = 'You are not allowed to do this') {
    return new AppError(ErrorCodes.FORBIDDEN, message);
  }

  static unauthenticated(message = 'Authentication is required') {
    return new AppError(ErrorCodes.AUTH_REQUIRED, message);
  }

  static conflict(message, details) {
    return new AppError(ErrorCodes.CONFLICT, message, { details });
  }
}
