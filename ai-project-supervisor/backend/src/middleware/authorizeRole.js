import { AppError } from '../shared/errors/AppError.js';
import { isRole } from '../shared/constants/roles.js';

export function authorizeRole(...allowedRoles) {
  const roles = allowedRoles.flat();

  if (roles.length === 0) {
    throw new TypeError('authorizeRole needs at least one role');
  }
  const unknown = roles.filter((role) => !isRole(role));
  if (unknown.length > 0) {
    throw new TypeError(`authorizeRole received unknown roles: ${unknown.join(', ')}`);
  }

  const allowed = new Set(roles);

  return function checkRole(req, res, next) {
    if (!req.user) return next(AppError.unauthenticated());
    if (!allowed.has(req.user.role)) return next(AppError.forbidden());
    return next();
  };
}
