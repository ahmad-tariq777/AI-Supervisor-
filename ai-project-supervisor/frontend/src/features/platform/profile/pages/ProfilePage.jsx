import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../shared/context/AuthContext.jsx';
import useApiResource from '../../../../shared/hooks/useApiResource.js';
import { fieldErrorsFrom, messageForError } from '../../../../shared/api/errorMessages.js';
import { ROLE_LABELS, ROLES } from '../../../../shared/router/roleHome.js';
import ErrorBanner from '../../../../shared/components/common/ErrorBanner.jsx';
import FieldError from '../../../../shared/components/common/FieldError.jsx';
import * as profileApi from '../api/profileApi.js';
import ChangePasswordForm from '../components/ChangePasswordForm.jsx';
import SkillsEditor from '../components/SkillsEditor.jsx';

export default function ProfilePage() {
  const { updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error: loadError } = useApiResource((signal) => profileApi.getProfile(signal), []);
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setProfile(data);
      setFullName(data.fullName);
    }
  }, [data]);

  const applyUpdate = (user) => {
    setProfile(user);
    setFullName(user.fullName);
    updateUser(user);
  };

  const handleNameSubmit = async (event) => {
    event.preventDefault();
    const trimmed = fullName.trim();
    const nextErrors = {};
    if (trimmed.length < 2) nextErrors.fullName = 'Full name must be at least 2 characters';
    else if (trimmed.length > 100) nextErrors.fullName = 'Full name must be at most 100 characters';
    setFieldErrors(nextErrors);
    setError('');
    setSaved(false);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      applyUpdate(await profileApi.updateProfile({ fullName: trimmed }));
      setSaved(true);
    } catch (err) {
      const serverFieldErrors = fieldErrorsFrom(err);
      setFieldErrors(serverFieldErrors);
      if (Object.keys(serverFieldErrors).length === 0) setError(messageForError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSkillsSave = async (skills) => {
    applyUpdate(await profileApi.updateProfile({ skills }));
  };

  const handlePasswordChanged = async () => {
    await logout();
    navigate('/login', {
      replace: true,
      state: { notice: 'Your password was changed. Sign in again with the new password.' }
    });
  };

  if (loading && !profile) return <p className="muted">Loading profile...</p>;
  if (loadError && !profile) return <ErrorBanner message={messageForError(loadError)} />;
  if (!profile) return null;

  return (
    <div className="page-stack">
      <h1>Your profile</h1>

      <section className="card" aria-labelledby="details-heading">
        <h2 id="details-heading">Account details</h2>
        <ErrorBanner message={error} />
        <form className="form" onSubmit={handleNameSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value);
                setSaved(false);
              }}
              aria-invalid={Boolean(fieldErrors.fullName)}
              aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
            />
            <FieldError id="fullName-error" message={fieldErrors.fullName} />
          </div>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={profile.email} readOnly />
          </div>
          <div className="form-field">
            <label htmlFor="role">Role</label>
            <input id="role" type="text" value={ROLE_LABELS[profile.role] ?? profile.role} readOnly />
          </div>
          <div className="form-actions">
            <button className="btn" type="submit" disabled={saving || fullName.trim() === profile.fullName}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            {saved && (
              <span className="success-text" role="status">
                Profile updated
              </span>
            )}
          </div>
        </form>
      </section>

      {profile.role === ROLES.STUDENT && (
        <SkillsEditor skills={profile.profile?.skills ?? []} onSave={handleSkillsSave} />
      )}

      <ChangePasswordForm onChanged={handlePasswordChanged} />
    </div>
  );
}
