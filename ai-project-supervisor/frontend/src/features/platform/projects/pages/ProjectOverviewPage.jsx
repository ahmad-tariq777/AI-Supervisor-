import { Link, useParams } from 'react-router-dom';
import useApiResource from '../../../../shared/hooks/useApiResource.js';
import { messageForError } from '../../../../shared/api/errorMessages.js';
import { formatDate } from '../../../../shared/utils/format.js';
import ErrorBanner from '../../../../shared/components/common/ErrorBanner.jsx';
import * as projectsApi from '../api/projectsApi.js';
import StageTracker, { stageState } from '../components/StageTracker.jsx';
import { MODE_LABELS, STAGES, accessLabel } from '../constants.js';

export default function ProjectOverviewPage() {
  const { projectId } = useParams();
  const { data: project, loading, error } = useApiResource(
    (signal) => projectsApi.getProject(projectId, signal),
    [projectId]
  );

  if (loading && !project) return <p className="muted">Loading project...</p>;

  if (error) {
    return (
      <section className="card">
        <h1>Project unavailable</h1>
        <ErrorBanner message={messageForError(error)} />
        <Link to="/projects">Back to projects</Link>
      </section>
    );
  }

  if (!project) return null;

  const role = accessLabel(project.access);

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/projects">Projects</Link>
          </p>
          <h1>{project.title}</h1>
        </div>
        {role && <span className="chip chip-role">{role}</span>}
      </div>

      <section className="card" aria-labelledby="progress-heading">
        <h2 id="progress-heading">Lifecycle</h2>
        <StageTracker stage={project.stage} />
      </section>

      <section className="card" aria-labelledby="details-heading">
        <h2 id="details-heading">Details</h2>
        {project.description && <p>{project.description}</p>}
        <dl className="detail-list">
          <div>
            <dt>Current stage</dt>
            <dd>{project.stage}</dd>
          </div>
          <div>
            <dt>Work mode</dt>
            <dd>{MODE_LABELS[project.mode] ?? project.mode}</dd>
          </div>
          <div>
            <dt>Methodology</dt>
            <dd>{project.methodology ?? 'Not chosen yet'}</dd>
          </div>
          <div>
            <dt>Supervisor</dt>
            <dd>{project.supervisor ? project.supervisor.fullName : 'Not assigned yet'}</dd>
          </div>
          <div>
            <dt>Deadline</dt>
            <dd>{project.deadline ? formatDate(project.deadline) : 'Not set'}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatDate(project.createdAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="card" aria-labelledby="stages-heading">
        <h2 id="stages-heading">Stages</h2>
        <ul className="stage-links">
          {STAGES.map((item, index) => {
            const state = stageState(project.stage, index);
            const label = state === 'current' ? 'Current' : state === 'done' ? 'Done' : 'Upcoming';
            return (
              <li key={item.key}>
                {item.path ? (
                  <Link to={item.path.replace(':projectId', project.id)}>{item.key}</Link>
                ) : (
                  <span>{item.key}</span>
                )}
                <span className="muted">{label}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
