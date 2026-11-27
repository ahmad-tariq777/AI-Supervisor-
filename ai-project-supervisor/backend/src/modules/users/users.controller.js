import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { usersService } from './users.service.js';

export const getMe = asyncHandler(async (req, res) => {
  const user = await usersService.getProfile(req.user.id);
  res.status(200).json({ user });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await usersService.updateProfile(req.user, req.body);
  req.log.info('users.profile_updated', { userId: req.user.id });
  res.status(200).json({ user });
});

export const changeMyPassword = asyncHandler(async (req, res) => {
  await usersService.changePassword(req.user.id, req.body);
  req.log.info('users.password_changed', { userId: req.user.id });
  res.status(204).end();
});
