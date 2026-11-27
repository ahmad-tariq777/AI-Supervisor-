import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { navItemsForRole } from '../../router/navigation.js';

export default function Sidebar({ open, onNavigate }) {
  const { user } = useAuth();
  if (!user) return null;

  const items = navItemsForRole(user.role);

  return (
    <aside id="app-sidebar" className={open ? 'sidebar sidebar-open' : 'sidebar'}>
      <nav aria-label="Main">
        <ul className="sidebar-list">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'
                }
                onClick={onNavigate}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
