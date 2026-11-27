import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../shared/context/AuthContext.jsx';
import { fieldErrorsFrom, messageForError } from '../../../../shared/api/errorMessages.js';
import { roleHome } from '../../../../shared/router/roleHome.js';
import ErrorBanner from '../../../../shared/components/common/ErrorBanner.jsx';
import FieldError from '../../../../shared/components/common/FieldError.jsx';

export default function LoginPage() {
  const { status, user, login } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') {
    const target = location.state?.from?.pathname ?? roleHome(user.role);
    return <Navigate to={target} replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.email.trim()) nextErrors.email = 'Email is required';
    if (!form.password) nextErrors.password = 'Password is required';
    setFieldErrors(nextErrors);
    setError('');
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
    } catch (err) {
      const serverFieldErrors = fieldErrorsFrom(err);
      setFieldErrors(serverFieldErrors);
      if (Object.keys(serverFieldErrors).length === 0) setError(messageForError(err));
      setSubmitting(false);
    }
  };

  return (
    <section className="card auth-card">
      <h1>Sign in</h1>
      {location.state?.notice && (
        <div className="notice-banner" role="status">
          {location.state.notice}
        </div>
      )}
      <ErrorBanner message={error} />
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          />
          <FieldError id="email-error" message={fieldErrors.email} />
        </div>
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
          />
          <FieldError id="password-error" message={fieldErrors.password} />
        </div>
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p className="muted">
        New here? <Link to="/register">Create a student account</Link>
      </p>
    </section>
  );
}
