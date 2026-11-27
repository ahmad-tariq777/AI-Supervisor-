import { createHash, randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/AppError.js';
import { ErrorCodes } from '../../shared/errors/errorCodes.js';
import { JwtError, signJwt, verifyJwt } from '../../shared/utils/jwt.js';

const ACCESS_TYPE = 'access';
const REFRESH_TYPE = 'refresh';

function toAppError(err) {
  if (err instanceof JwtError && err.reason === 'expired') {
    return new AppError(ErrorCodes.TOKEN_EXPIRED, 'The token has expired');
  }
  return new AppError(ErrorCodes.TOKEN_INVALID, 'The token is not valid');
}

export function createTokenService({
  accessSecret,
  refreshSecret,
  accessTtlSeconds,
  refreshTtlSeconds,
  clock = Date.now
}) {
  function verify(token, secret, type) {
    let payload;
    try {
      payload = verifyJwt(token, secret, { now: clock() });
    } catch (err) {
      throw toAppError(err);
    }
    if (payload.typ !== type || typeof payload.sub !== 'string') {
      throw new AppError(ErrorCodes.TOKEN_INVALID, 'The token is not valid');
    }
    return payload;
  }

  return {
    accessTtlSeconds,
    refreshTtlSeconds,

    signAccessToken(user) {
      return signJwt(
        { sub: String(user.id ?? user._id), role: user.role, typ: ACCESS_TYPE },
        accessSecret,
        { expiresInSeconds: accessTtlSeconds, now: clock() }
      );
    },

    signRefreshToken(user) {
      const jti = randomUUID();
      const token = signJwt(
        { sub: String(user.id ?? user._id), jti, typ: REFRESH_TYPE },
        refreshSecret,
        { expiresInSeconds: refreshTtlSeconds, now: clock() }
      );
      return {
        token,
        jti,
        expiresAt: new Date(clock() + refreshTtlSeconds * 1000)
      };
    },

    verifyAccessToken(token) {
      return verify(token, accessSecret, ACCESS_TYPE);
    },

    verifyRefreshToken(token) {
      const payload = verify(token, refreshSecret, REFRESH_TYPE);
      if (typeof payload.jti !== 'string') {
        throw new AppError(ErrorCodes.TOKEN_INVALID, 'The token is not valid');
      }
      return payload;
    },

    hashJti(jti) {
      return createHash('sha256').update(jti).digest('hex');
    }
  };
}

export const tokenService = createTokenService({
  accessSecret: env.JWT_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessTtlSeconds: Math.round(env.ACCESS_TOKEN_TTL_MINUTES * 60),
  refreshTtlSeconds: Math.round(env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60)
});
