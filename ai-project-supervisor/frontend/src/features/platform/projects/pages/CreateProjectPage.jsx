import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fieldErrorsFrom, messageForError } from '../../../../shared/api/errorMessages.js';
import ErrorBanner from '../../../../shared/components/common/ErrorBanner.jsx';
import FieldError from '../../../../shared/components/common/FieldError.jsx';
import * as projectsApi from '../api/projectsApi.js';

const TITLE_MIN = 3;
const TITLE_MAX = 150;
const DESCRIPTION_MAX = 2000;

function tomorrowIso() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function validateProject(form, minDeadline) {
  const errors = {};
  const title = form.title.trim();

  if (title.length < TITLE_MIN) errors.title = `Title must be at least ${TITLE_MIN} characters`;
  else if (title.length > TITLE_MAX) errors.title = `Title must be at most ${TITLE_MAX} characters`;

  if (form.description.trim().length > DESCRIPTION_MAX) {
    errors.description = `Description must be at most ${DESCRIPTION_MAX} characters`;
  }

  if (!form.mode) errors.mode = 'Choose how you will work on this project';

  if (form.deadline && form.deadline < minDeadline) {
    errors.deadline = 'Deadline must be in the future';
  }

  return errors;
}

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const minDeadline = tomorrowIso();
  const [form, setForm] = useState({ title: '', description: '', mode: 'individual', deadline: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateProject(form, minDeadline);
    setFieldErrors(nextErrors);
    setError('');
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const project = await projectsApi.createProject({
        title: form.title.trim(),
        description: form.description.trim(),
        mode: form.mode,
        deadline: form.deadline
      });
      navigate(`/projects/${project.id}`, { replace: true });
    } catch (err) {
      const serverFieldErrors = fieldErrorsFrom(err);
      setFieldErrors(serverFieldErrors);
      if (Object.keys(serverFieldErrors).length === 0) setError(messageForError(err));
      setSubmitting(false);
    }
  };

  return (
    <section className="card form-card">
      <h1>New project</h1>
      <ErrorBanner message={error} />
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="title">Project title</label>
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.title)}
            aria-describedby={fieldErrors.title ? 'title-error' : undefined}
          />
          <FieldError id="title-error" message={fieldErrors.title} />
        </div>

        <div className="form-field">
          <label htmlFor="description">Description (optional)</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={form.description}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.description)}
            aria-describedby={fieldErrors.description ? 'description-error' : undefined}
          />
          <FieldError id="description-error" message={fieldErrors.description} />
        </div>

        <fieldset className="form-field choice-group">
          <legend>Work mode</legend>
          <label className="choice">
            <input
              type="radio"
              name="mode"
              value="individual"
              checked={form.mode === 'individual'}
              onChange={handleChange}
            />
            <span>
              <strong>Individual</strong>
              <span className="muted"> You work on the project alone.</span>
            </span>
          </label>
          <label className="choice">
            <input
              type="radio"
              name="mode"
              value="team"
              checked={form.mode === 'team'}
              onChange={handleChange}
            />
            <span>
              <strong>Team</strong>
              <span className="muted"> You lead the project and can invite teammates later.</span>
            </span>
          </label>
          <FieldError id="mode-error" message={fieldErrors.mode} />
        </fieldset>

        <div className="form-field">
          <label htmlFor="deadline">Deadline (optional)</label>
          <input
            id="deadline"
            name="deadline"
            type="date"
            min={minDeadline}
            value={form.deadline}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.deadline)}
            aria-describedby={fieldErrors.deadline ? 'deadline-error' : undefined}
          />
          <FieldError id="deadline-error" message={fieldErrors.deadline} />
        </div>

        <div className="form-actions">
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create project'}
          </button>
          <Link className="btn btn-secondary" to="/projects">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
