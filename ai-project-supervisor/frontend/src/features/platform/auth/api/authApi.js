import {
  apiRequest,
  clearSession,
  getRefreshToken,
  refreshSession,
  setSession
} from '../../../../shared/api/apiClient.js';

export async function register({ fullName, email, password }) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: { fullName, email, password },
    skipAuth: true
  });
  return data.user;
}

export async function login({ email, password }) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
    skipAuth: true
  });
  setSession(data);
  return data.user;
}

export async function restoreSession() {
  const data = await refreshSession();
  return data.user;
}

export async function logout() {
  const refreshToken = getRefreshToken();
  clearSession();
  if (!refreshToken) return;
  try {
    await apiRequest('/auth/logout', {
      method: 'POST',
      body: { refreshToken },
      skipAuth: true
    });
  } catch {
    return;
  }
}
