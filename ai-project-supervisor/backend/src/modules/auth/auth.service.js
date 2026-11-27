import { randomBytes } from 'node:crypto';
import { AppError } from '../../shared/errors/AppError.js';
import { ErrorCodes } from '../../shared/errors/errorCodes.js';
import { ROLES } from '../../shared/constants/roles.js';
import { hashPassword, verifyPassword } from '../../shared/utils/password.js';
import { User } from '../users/user.model.js';
import { publicUser } from '../users/user.presenter.js';
import { tokenService } from './token.service.js';

const MAX_SESSIONS_PER_USER = 10;
const DUPLICATE_KEY = 11000;

export function createAuthService({
  userModel,
  tokens,
  hash = hashPassword,
  verify = verifyPassword
}) {
  let dummyHash;
  const getDummyHash = () => {
    dummyHash ??= hash(randomBytes(16).toString('hex'));
    return dummyHash;
  };

  async function issueSession(user) {
    const accessToken = tokens.signAccessToken(user);
    const refresh = tokens.signRefreshToken(user);

    await userModel.updateOne(
      { _id: user._id },
      {
        $push: {
          refreshSessions: {
            $each: [{ tokenHash: tokens.hashJti(refresh.jti), expiresAt: refresh.expiresAt }],
            $slice: -MAX_SESSIONS_PER_USER
          }
        }
      }
    );

    return {
      user: publicUser(user),
      accessToken,
      refreshToken: refresh.token,
      tokenType: 'Bearer',
      expiresIn: tokens.accessTtlSeconds
    };
  }

  async function register({ fullName, email, password }) {
    const passwordHash = await hash(password);

    try {
      const user = await userModel.create({
        fullName,
        email,
        passwordHash,
        role: ROLES.STUDENT
      });
      return { user: publicUser(user) };
    } catch (err) {
      if (err?.code === DUPLICATE_KEY) {
        throw AppError.conflict('An account with this email already exists', [
          { field: 'email', message: 'An account with this email already exists' }
        ]);
      }
      throw err;
    }
  }

  async function login({ email, password }) {
    const user = await userModel.findOne({ email }).select('+passwordHash');

    const matches = await verify(password, user?.passwordHash ?? (await getDummyHash()));

    if (!user || !matches) {
      throw new AppError(ErrorCodes.INVALID_CREDENTIALS, 'Email or password is incorrect');
    }
    if (!user.isActive) {
      throw new AppError(ErrorCodes.ACCOUNT_DEACTIVATED, 'This account has been deactivated');
    }

    return issueSession(user);
  }

  async function refresh({ refreshToken }) {
    const payload = tokens.verifyRefreshToken(refreshToken);
    const tokenHash = tokens.hashJti(payload.jti);

    const user = await userModel.findOneAndUpdate(
      { _id: payload.sub, 'refreshSessions.tokenHash': tokenHash },
      { $pull: { refreshSessions: { tokenHash } } }
    );

    if (!user) {
      await userModel.updateOne({ _id: payload.sub }, { $set: { refreshSessions: [] } });
      throw new AppError(ErrorCodes.TOKEN_INVALID, 'The token is not valid');
    }
    if (!user.isActive) {
      throw new AppError(ErrorCodes.ACCOUNT_DEACTIVATED, 'This account has been deactivated');
    }

    return issueSession(user);
  }

  async function logout({ refreshToken }) {
    let payload;
    try {
      payload = tokens.verifyRefreshToken(refreshToken);
    } catch {
      return;
    }
    const tokenHash = tokens.hashJti(payload.jti);
    await userModel.updateOne(
      { _id: payload.sub },
      { $pull: { refreshSessions: { tokenHash } } }
    );
  }

  return { register, login, refresh, logout };
}

export const authService = createAuthService({ userModel: User, tokens: tokenService });
