import { useState } from 'react';
import { fieldErrorsFrom, messageForError } from '../../../../shared/api/errorMessages.js';
import ErrorBanner from '../../../../shared/components/common/ErrorBanner.jsx';
import FieldError from '../../../../shared/components/common/FieldError.jsx';
import * as profileApi from '../api/profileApi.js';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

export function validatePasswordChange(form) {
  const errors = {};

  if (!form.currentPassword) errors.currentPassword = 'Current password is required';

  if (form.newPassword.length < PASSWORD_MIN_LENGTH) {
    errors.newPassword = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  } else if (form.newPassword.length > PASSWORD_MAX_LENGTH) {
    errors.newPassword = `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
  } else if (!/[A-Za-z]/.test(form.newPassword)) {
    errors.newPassword = 'Password must contain at least one letter';
  } else if (!/[0-9]/.test(form.newPassword)) {
    errors.newPassword = 'Password must contain at least one number';
  } else if (form.newPassword === form.currentPassword) {
    errors.newPassword = 'New password must be different from the current password';
  }

  if (form.confirmPassword !== form.newPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}

export default function ChangePasswordForm({ onChanged }) {
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validatePasswordChange(form);
    setFieldErrors(nextErrors);
    setError('');
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await profileApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      setForm(EMPTY);
      await onChanged();
    } catch (err) {
      const serverFieldErrors = fieldErrorsFrom(err);
      setFieldErrors(serverFieldErrors);
      if (Object.keys(serverFieldErrors).length === 0) setError(messageForError(err));
      setSubmitting(false);
    }
  };

  const field = (name, label, autoComplete) => (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type="password"
        autoComplete={autoComplete}
        value={form[name]}
        onChange={handleChange}
        aria-invalid={Boolean(fieldErrors[name])}
        aria-describedby={fieldErrors[name] ? `${name}-error` : undefined}
      />
      <FieldError id={`${name}-error`} message={fieldErrors[name]} />
    </div>
  );

  return (
    <section className="card" aria-labelledby="password-heading">
      <h2 id="password-heading">Change password</h2>
      <p className="muted">You will be signed out everywhere after changing your password.</p>
      <ErrorBanner message={error} />
      <form className="form" onSubmit={handleSubmit} noValidate>
        {field('currentPassword', 'Current password', 'current-password')}
        {field('newPassword', 'New password', 'new-password')}
        <p className="hint">At least 8 characters, with a letter and a number.</p>
        {field('confirmPassword', 'Confirm new password', 'new-password')}
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Changing...' : 'Change password'}
        </button>
      </form>
    </section>
  );
}
