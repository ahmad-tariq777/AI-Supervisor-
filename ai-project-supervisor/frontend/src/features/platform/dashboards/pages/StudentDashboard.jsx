import { Link } from 'react-router-dom';
import { useAuth } from '../../../../shared/context/AuthContext.jsx';
import useApiResource from '../../../../shared/hooks/useApiResource.js';
import { messageForError } from '../../../../shared/api/errorMessages.js';
import EmptyState from '../../../../shared/components/common/EmptyState.jsx';
import ErrorBanner from '../../../../shared/components/common/ErrorBanner.jsx';
import * as projectsApi from '../../projects/api/projectsApi.js';
import ProjectCard from '../../projects/components/ProjectCard.jsx';

const RECENT_LIMIT = 3;

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useApiResource(
    (signal) => projectsApi.listProjects({ page: 1, limit: RECENT_LIMIT }, signal),
    []
  );

  const firstName = user.fullName.split(' ')[0];
  const skillCount = user.profile?.skills?.length ?? 0;

  return (
    <div className="page-stack">
      <div className="page-header">
        <h1>Welcome, {firstName}</h1>
        <Link className="btn" to="/projects/new">
          New project
        </Link>
      </div>

      <div className="stat-grid">
        <div className="card stat">
          <p className="stat-value">{data ? data.total : '-'}</p>
          <p className="muted">Projects</p>
        </div>
        <div className="card stat">
          <p className="stat-value">{skillCount}</p>
          <p className="muted">
            Skills on your profile
            {skillCount === 0 && (
              <>
                {' '}
                &middot; <Link to="/profile">Add skills</Link>
              </>
            )}
          </p>
        </div>
      </div>

      <section aria-labelledby="recent-heading">
        <div className="page-header">
          <h2 id="recent-heading">Recent projects</h2>
          {data && data.total > RECENT_LIMIT && <Link to="/projects">View all</Link>}
        </div>

        <ErrorBanner message={error ? messageForError(error) : ''} />
        {loading && !data && <p className="muted">Loading projects...</p>}

        {data && data.projects.length === 0 && (
          <EmptyState title="No projects yet">
            Create your first project to start discovering ideas.
          </EmptyState>
        )}

        {data && data.projects.length > 0 && (
          <div className="project-grid">
            {data.projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
