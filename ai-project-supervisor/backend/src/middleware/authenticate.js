import { AppError } from '../shared/errors/AppError.js';
import { ErrorCodes } from '../shared/errors/errorCodes.js';
import { tokenService } from '../modules/auth/token.service.js';
import { User } from '../modules/users/user.model.js';

const BEARER = /^Bearer ([A-Za-z0-9._-]+)$/;

export function createAuthenticate({ tokens, findUserById }) {
  return async function authenticate(req, res, next) {
    try {
      const match = BEARER.exec(req.get('authorization') ?? '');
      if (!match) throw AppError.unauthenticated();

      const payload = tokens.verifyAccessToken(match[1]);

      const user = await findUserById(payload.sub);
      if (!user) throw new AppError(ErrorCodes.TOKEN_INVALID, 'The token is not valid');
      if (!user.isActive) {
        throw new AppError(ErrorCodes.ACCOUNT_DEACTIVATED, 'This account has been deactivated');
      }

      req.user = {
        id: String(user.id ?? user._id),
        email: user.email,
        fullName: user.fullName,
        role: user.role
      };
      req.log = req.log?.child({ userId: req.user.id });
      next();
    } catch (err) {
      next(err);
    }
  };
}

export const authenticate = createAuthenticate({
  tokens: tokenService,
  findUserById: (id) => User.findById(id)
});
