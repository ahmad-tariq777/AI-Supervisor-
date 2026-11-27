const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1';
const REFRESH_TOKEN_KEY = 'aps.refreshToken';
const SESSION_ENDING_CODES = new Set(['TOKEN_INVALID', 'ACCOUNT_DEACTIVATED', 'AUTH_REQUIRED']);

let accessToken = null;
let refreshInFlight = null;
let sessionEndedHandler = null;

export class ApiError extends Error {
  constructor({ code, message, status, details, requestId, body }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
    this.body = body;
  }
}

function readStoredRefreshToken() {
  try {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeStoredRefreshToken(value) {
  try {
    if (value) {
      window.localStorage.setItem(REFRESH_TOKEN_KEY, value);
    } else {
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch {
    return;
  }
}

export function getRefreshToken() {
  return readStoredRefreshToken();
}

export function setSession({ accessToken: nextAccessToken, refreshToken }) {
  accessToken = nextAccessToken ?? null;
  writeStoredRefreshToken(refreshToken ?? null);
}

export function clearSession() {
  accessToken = null;
  writeStoredRefreshToken(null);
}

export function setSessionEndedHandler(handler) {
  sessionEndedHandler = handler;
}

function endSession() {
  clearSession();
  if (sessionEndedHandler) sessionEndedHandler();
}

async function send(path, { method = 'GET', body, signal, token }) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal
    });
  } catch (cause) {
    if (cause?.name === 'AbortError') throw cause;
    throw new ApiError({
      code: 'NETWORK_ERROR',
      message: 'Cannot reach the server. Check that the backend is running.',
      status: 0
    });
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = data?.error;
    throw new ApiError({
      code: error?.code ?? 'UNKNOWN_ERROR',
      message: error?.message ?? 'The request failed',
      status: response.status,
      details: error?.details,
      requestId: error?.requestId,
      body: data
    });
  }

  return data;
}

async function performRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new ApiError({
      code: 'AUTH_REQUIRED',
      message: 'There is no active session',
      status: 401
    });
  }

  try {
    const data = await send('/auth/refresh', { method: 'POST', body: { refreshToken } });
    setSession(data);
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
      clearSession();
    }
    throw error;
  }
}

export function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function apiRequest(path, { method = 'GET', body, signal, skipAuth = false } = {}) {
  const options = { method, body, signal };

  try {
    return await send(path, { ...options, token: skipAuth ? null : accessToken });
  } catch (error) {
    if (skipAuth || !(error instanceof ApiError)) throw error;

    if (error.code === 'TOKEN_EXPIRED') {
      try {
        await refreshSession();
      } catch (refreshError) {
        if (refreshError instanceof ApiError && refreshError.status >= 400 && refreshError.status < 500) {
          endSession();
        }
        throw refreshError;
      }
      return send(path, { ...options, token: accessToken });
    }

    if (SESSION_ENDING_CODES.has(error.code)) endSession();
    throw error;
  }
}
