import { Link } from 'react-router-dom';
import { formatDate } from '../../../../shared/utils/format.js';
import { MODE_LABELS, accessLabel } from '../constants.js';

export default function ProjectCard({ project }) {
  const role = accessLabel(project.access);

  return (
    <article className="project-card">
      <h3>
        <Link to={`/projects/${project.id}`}>{project.title}</Link>
      </h3>
      <div className="chip-row">
        <span className="chip">{MODE_LABELS[project.mode] ?? project.mode}</span>
        <span className="chip chip-stage">{project.stage}</span>
        {role && <span className="chip chip-role">{role}</span>}
      </div>
      {project.description && <p className="project-card-text">{project.description}</p>}
      <p className="muted project-card-meta">
        {project.deadline ? `Deadline ${formatDate(project.deadline)}` : 'No deadline set'}
      </p>
    </article>
  );
}
