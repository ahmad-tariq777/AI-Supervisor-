import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function AppLayout() {
  const { status } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const authenticated = status === 'authenticated';

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Topbar menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((open) => !open)} />
      <div className="app-body">
        {authenticated && <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />}
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
