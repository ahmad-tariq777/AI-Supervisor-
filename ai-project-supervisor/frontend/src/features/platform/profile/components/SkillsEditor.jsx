import { useEffect, useState } from 'react';
import { fieldErrorsFrom, messageForError } from '../../../../shared/api/errorMessages.js';
import FieldError from '../../../../shared/components/common/FieldError.jsx';

export const MAX_SKILLS = 50;
export const MAX_SKILL_LENGTH = 50;

export function mergeSkills(current, rawInput) {
  const additions = rawInput
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const next = [...current];
  const seen = new Set(next.map((skill) => skill.toLowerCase()));
  for (const skill of additions) {
    if (skill.length > MAX_SKILL_LENGTH) {
      return { skills: current, error: `A skill must be at most ${MAX_SKILL_LENGTH} characters` };
    }
    if (seen.has(skill.toLowerCase())) continue;
    if (next.length >= MAX_SKILLS) {
      return { skills: current, error: `You can store at most ${MAX_SKILLS} skills` };
    }
    seen.add(skill.toLowerCase());
    next.push(skill);
  }
  return { skills: next, error: '' };
}

export default function SkillsEditor({ skills, onSave }) {
  const [draft, setDraft] = useState(skills);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(skills);
  }, [skills]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(skills);

  const addFromInput = () => {
    if (!input.trim()) return;
    const result = mergeSkills(draft, input);
    setError(result.error);
    setSaved(false);
    if (!result.error) {
      setDraft(result.skills);
      setInput('');
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addFromInput();
    }
  };

  const removeSkill = (skill) => {
    setDraft((current) => current.filter((item) => item !== skill));
    setSaved(false);
    setError('');
  };

  const handleSave = async () => {
    const pending = input.trim() ? mergeSkills(draft, input) : { skills: draft, error: '' };
    if (pending.error) {
      setError(pending.error);
      return;
    }

    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await onSave(pending.skills);
      setInput('');
      setSaved(true);
    } catch (err) {
      const fieldErrors = fieldErrorsFrom(err);
      const skillError = Object.entries(fieldErrors).find(([field]) =>
        field.startsWith('profile.skills')
      );
      setError(skillError ? skillError[1] : messageForError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card" aria-labelledby="skills-heading">
      <h2 id="skills-heading">Technical skills</h2>
      <p className="muted">
        Skills you list here pre-fill your planning forms. Separate several skills with commas.
      </p>

      {draft.length > 0 ? (
        <ul className="tag-list" aria-label="Your skills">
          {draft.map((skill) => (
            <li key={skill} className="tag">
              <span>{skill}</span>
              <button
                type="button"
                className="tag-remove"
                aria-label={`Remove ${skill}`}
                onClick={() => removeSkill(skill)}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No skills added yet.</p>
      )}

      <div className="form-field">
        <label htmlFor="skill-input">Add a skill</label>
        <div className="inline-form">
          <input
            id="skill-input"
            type="text"
            value={input}
            maxLength={MAX_SKILL_LENGTH * 4}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'skill-error' : undefined}
          />
          <button className="btn btn-secondary" type="button" onClick={addFromInput}>
            Add
          </button>
        </div>
        <FieldError id="skill-error" message={error} />
      </div>

      <div className="form-actions">
        <button
          className="btn"
          type="button"
          onClick={handleSave}
          disabled={saving || (!dirty && !input.trim())}
        >
          {saving ? 'Saving...' : 'Save skills'}
        </button>
        {saved && (
          <span className="success-text" role="status">
            Skills saved
          </span>
        )}
      </div>
    </section>
  );
}
