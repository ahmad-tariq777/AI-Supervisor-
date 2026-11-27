import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../../shared/context/AuthContext.jsx';
import useApiResource from '../../../../shared/hooks/useApiResource.js';
import { messageForError } from '../../../../shared/api/errorMessages.js';
import { ROLES } from '../../../../shared/router/roleHome.js';
import EmptyState from '../../../../shared/components/common/EmptyState.jsx';
import ErrorBanner from '../../../../shared/components/common/ErrorBanner.jsx';
import * as projectsApi from '../api/projectsApi.js';
import ProjectCard from '../components/ProjectCard.jsx';
import { STAGE_KEYS } from '../constants.js';

const PAGE_SIZE = 12;

const TITLES = {
  [ROLES.STUDENT]: 'My projects',
  [ROLES.SUPERVISOR]: 'Assigned projects',
  [ROLES.SUB_ADMIN]: 'All projects',
  [ROLES.SUPER_ADMIN]: 'All projects'
};

export default function ProjectListPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [stage, setStage] = useState('');

  const { data, loading, error } = useApiResource(
    (signal) => projectsApi.listProjects({ page, limit: PAGE_SIZE, stage: stage || undefined }, signal),
    [page, stage]
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const isStudent = user.role === ROLES.STUDENT;

  const handleStageChange = (event) => {
    setStage(event.target.value);
    setPage(1);
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <h1>{TITLES[user.role] ?? 'Projects'}</h1>
        {isStudent && (
          <Link className="btn" to="/projects/new">
            New project
          </Link>
        )}
      </div>

      <div className="toolbar">
        <div className="form-field toolbar-field">
          <label htmlFor="stage-filter">Stage</label>
          <select id="stage-filter" value={stage} onChange={handleStageChange}>
            <option value="">All stages</option>
            {STAGE_KEYS.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
        {data && <p className="muted">{data.total === 1 ? '1 project' : `${data.total} projects`}</p>}
      </div>

      <ErrorBanner message={error ? messageForError(error) : ''} />
      {loading && !data && <p className="muted">Loading projects...</p>}

      {data && data.projects.length === 0 && (
        <EmptyState title={stage ? 'No projects at this stage' : 'No projects yet'}>
          {isStudent && !stage
            ? 'Create your first project to start discovering ideas.'
            : 'Projects you can access will appear here.'}
        </EmptyState>
      )}

      {data && data.projects.length > 0 && (
        <div className="project-grid">
          {data.projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {data && totalPages > 1 && (
        <nav className="pagination" aria-label="Project pages">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => setPage((current) => current - 1)}
            disabled={page <= 1 || loading}
          >
            Previous
          </button>
          <span className="muted">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={page >= totalPages || loading}
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
