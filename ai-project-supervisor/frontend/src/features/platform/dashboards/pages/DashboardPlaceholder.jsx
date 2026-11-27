import { useAuth } from '../../../../shared/context/AuthContext.jsx';
import { ROLE_LABELS } from '../../../../shared/router/roleHome.js';

export default function DashboardPlaceholder({ title }) {
  const { user } = useAuth();
  return (
    <section className="card">
      <h1>{title}</h1>
      <p>
        Signed in as <strong>{user.fullName}</strong> ({ROLE_LABELS[user.role] ?? user.role}).
      </p>
      <p className="muted">This dashboard is a placeholder until its sprint task replaces it.</p>
    </section>
  );
}
