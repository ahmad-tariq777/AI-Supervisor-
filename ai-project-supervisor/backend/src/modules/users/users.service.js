import { AppError } from '../../shared/errors/AppError.js';
import { ROLES } from '../../shared/constants/roles.js';
import { hashPassword, verifyPassword } from '../../shared/utils/password.js';
import { User } from './user.model.js';
import { publicUser } from './user.presenter.js';

export function createUsersService({
  userModel,
  hash = hashPassword,
  verify = verifyPassword
}) {
  async function getProfile(userId) {
    const user = await userModel.findById(userId);
    if (!user) throw AppError.notFound('User not found');
    return publicUser(user);
  }

  async function updateProfile(actor, { fullName, profile }) {
    const changes = {};

    if (fullName !== undefined) {
      changes.fullName = fullName;
    }

    if (profile?.skills !== undefined) {
      if (actor.role !== ROLES.STUDENT) {
        throw AppError.forbidden('Only students can store technical skills');
      }
      changes['profile.skills'] = profile.skills;
    }

    const user = await userModel.findByIdAndUpdate(
      actor.id,
      { $set: changes },
      { new: true, runValidators: true }
    );
    if (!user) throw AppError.notFound('User not found');
    return publicUser(user);
  }

  async function changePassword(userId, { currentPassword, newPassword }) {
    const user = await userModel.findById(userId).select('+passwordHash');
    if (!user) throw AppError.notFound('User not found');

    const matches = await verify(currentPassword, user.passwordHash);
    if (!matches) {
      throw AppError.validation('The request is not valid', [
        { source: 'body', field: 'currentPassword', message: 'Current password is incorrect' }
      ]);
    }

    if (currentPassword === newPassword) {
      throw AppError.validation('The request is not valid', [
        {
          source: 'body',
          field: 'newPassword',
          message: 'New password must be different from the current password'
        }
      ]);
    }

    const passwordHash = await hash(newPassword);
    await userModel.updateOne(
      { _id: user._id },
      { $set: { passwordHash, refreshSessions: [] } }
    );
  }

  return { getProfile, updateProfile, changePassword };
}

export const usersService = createUsersService({ userModel: User });
