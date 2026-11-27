import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../../../shared/context/AuthContext.jsx';
import { fieldErrorsFrom, messageForError } from '../../../../shared/api/errorMessages.js';
import { roleHome } from '../../../../shared/router/roleHome.js';
import ErrorBanner from '../../../../shared/components/common/ErrorBanner.jsx';
import FieldError from '../../../../shared/components/common/FieldError.jsx';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  const errors = {};
  const fullName = form.fullName.trim();

  if (fullName.length < 2) errors.fullName = 'Full name must be at least 2 characters';
  else if (fullName.length > 100) errors.fullName = 'Full name must be at most 100 characters';

  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address';

  if (form.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  } else if (form.password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
  } else if (!/[A-Za-z]/.test(form.password)) {
    errors.password = 'Password must contain at least one letter';
  } else if (!/[0-9]/.test(form.password)) {
    errors.password = 'Password must contain at least one number';
  }

  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}

export default function RegisterPage() {
  const { status, user, register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setFieldErrors(nextErrors);
    setError('');
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password
      });
    } catch (err) {
      const serverFieldErrors = fieldErrorsFrom(err);
      setFieldErrors(serverFieldErrors);
      if (Object.keys(serverFieldErrors).length === 0) setError(messageForError(err));
      setSubmitting(false);
    }
  };

  const field = (name, label, type, autoComplete) => (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
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
    <section className="card auth-card">
      <h1>Create a student account</h1>
      <ErrorBanner message={error} />
      <form className="form" onSubmit={handleSubmit} noValidate>
        {field('fullName', 'Full name', 'text', 'name')}
        {field('email', 'Email', 'email', 'email')}
        {field('password', 'Password', 'password', 'new-password')}
        <p className="hint">At least 8 characters, with a letter and a number.</p>
        {field('confirmPassword', 'Confirm password', 'password', 'new-password')}
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="muted">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </section>
  );
}
