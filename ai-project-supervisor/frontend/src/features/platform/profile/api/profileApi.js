import { apiRequest } from '../../../../shared/api/apiClient.js';

export async function getProfile(signal) {
  const data = await apiRequest('/users/me', { signal });
  return data.user;
}

export async function updateProfile({ fullName, skills }) {
  const body = {};
  if (fullName !== undefined) body.fullName = fullName;
  if (skills !== undefined) body.profile = { skills };
  const data = await apiRequest('/users/me', { method: 'PATCH', body });
  return data.user;
}

export async function changePassword({ currentPassword, newPassword }) {
  await apiRequest('/users/me/password', {
    method: 'POST',
    body: { currentPassword, newPassword }
  });
}
