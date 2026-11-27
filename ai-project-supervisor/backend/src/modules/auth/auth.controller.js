import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { authService } from './auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  req.log.info('auth.registered', { userId: result.user.id });
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  req.log.info('auth.login', { userId: result.user.id });
  res.status(200).json(result);
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body);
  res.status(200).json(result);
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body);
  res.status(204).end();
});
