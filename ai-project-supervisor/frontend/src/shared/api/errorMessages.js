const MESSAGES = {
  INVALID_CREDENTIALS: 'Email or password is incorrect.',
  ACCOUNT_DEACTIVATED: 'This account has been deactivated. Contact an administrator.',
  TOKEN_EXPIRED: 'Your session has expired. Please sign in again.',
  TOKEN_INVALID: 'Your session is no longer valid. Please sign in again.',
  AUTH_REQUIRED: 'Please sign in to continue.',
  FORBIDDEN: 'You are not allowed to do this.',
  NOT_FOUND: 'We could not find what you were looking for.',
  RATE_LIMITED: 'Too many attempts. Please wait a moment and try again.',
  PAYLOAD_TOO_LARGE: 'The data you sent is too large.',
  NETWORK_ERROR: 'Cannot reach the server. Check that the backend is running.',
  INTERNAL_ERROR: 'Something went wrong on the server. Please try again.'
};

export function messageForError(error) {
  if (!error) return '';
  return MESSAGES[error.code] ?? error.message ?? 'Something went wrong. Please try again.';
}

export function fieldErrorsFrom(error) {
  const fieldErrors = {};
  if (Array.isArray(error?.details)) {
    for (const detail of error.details) {
      if (detail?.field && !fieldErrors[detail.field]) {
        fieldErrors[detail.field] = detail.message;
      }
    }
  }
  return fieldErrors;
}
