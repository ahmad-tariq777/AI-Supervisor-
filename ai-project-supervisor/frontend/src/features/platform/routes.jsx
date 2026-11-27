import StatusPage from './pages/StatusPage.jsx';
import LoginPage from './auth/pages/LoginPage.jsx';
import RegisterPage from './auth/pages/RegisterPage.jsx';
import DashboardPlaceholder from './dashboards/pages/DashboardPlaceholder.jsx';
import StudentDashboard from './dashboards/pages/StudentDashboard.jsx';
import ProfilePage from './profile/pages/ProfilePage.jsx';
import CreateProjectPage from './projects/pages/CreateProjectPage.jsx';
import ProjectListPage from './projects/pages/ProjectListPage.jsx';
import ProjectOverviewPage from './projects/pages/ProjectOverviewPage.jsx';
import { ROLES } from '../../shared/router/roleHome.js';

const ALL_ROLES = Object.values(ROLES);

export const platformRoutes = [
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/status', element: <StatusPage /> }
];

export const platformProtectedRoutes = [
  { path: '/student', roles: [ROLES.STUDENT], element: <StudentDashboard /> },
  {
    path: '/supervisor',
    roles: [ROLES.SUPERVISOR],
    element: <DashboardPlaceholder title="Supervisor dashboard" />
  },
  {
    path: '/sub-admin',
    roles: [ROLES.SUB_ADMIN],
    element: <DashboardPlaceholder title="Sub Admin dashboard" />
  },
  {
    path: '/super-admin',
    roles: [ROLES.SUPER_ADMIN],
    element: <DashboardPlaceholder title="Super Admin dashboard" />
  },
  { path: '/profile', roles: ALL_ROLES, element: <ProfilePage /> },
  { path: '/projects', roles: ALL_ROLES, element: <ProjectListPage /> },
  { path: '/projects/new', roles: [ROLES.STUDENT], element: <CreateProjectPage /> },
  { path: '/projects/:projectId', roles: ALL_ROLES, element: <ProjectOverviewPage /> }
];
