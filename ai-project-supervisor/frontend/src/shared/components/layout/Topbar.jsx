import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLE_LABELS } from '../../router/roleHome.js';

export default function Topbar({ menuOpen, onToggleMenu }) {
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar-start">
        {status === 'authenticated' && (
          <button
            className="menu-toggle"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            aria-controls="app-sidebar"
            onClick={onToggleMenu}
          >
            <span aria-hidden="true">&#9776;</span>
          </button>
        )}
        <Link to="/" className="brand">
          AI Project Supervisor
        </Link>
      </div>
      <nav className="topbar-user" aria-label="Account">
        {status === 'authenticated' && (
          <>
            <Link to="/profile" className="topbar-name">
              {user.fullName}
            </Link>
            <span className="role-chip">{ROLE_LABELS[user.role] ?? user.role}</span>
            <button className="btn btn-secondary" type="button" onClick={handleLogout}>
              Sign out
            </button>
          </>
        )}
        {status === 'anonymous' && (
          <>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}
