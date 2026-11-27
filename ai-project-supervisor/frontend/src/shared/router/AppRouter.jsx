import { Link, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import { roleHome } from './roleHome.js';
import { platformProtectedRoutes, platformRoutes } from '../../features/platform/routes.jsx';

function NotFoundPage() {
  return (
    <section className="card">
      <h1>Page not found</h1>
      <p>The page you asked for does not exist.</p>
      <Link to="/">Back to home</Link>
    </section>
  );
}

function RootRedirect() {
  const { status, user } = useAuth();
  if (status === 'loading') return <p className="muted">Loading...</p>;
  return <Navigate to={user ? roleHome(user.role) : '/login'} replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<RootRedirect />} />
        {platformRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        {platformProtectedRoutes.map((route) => (
          <Route key={route.path} element={<ProtectedRoute roles={route.roles} />}>
            <Route path={route.path} element={route.element} />
          </Route>
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
