import { ROLES } from './roleHome.js';

const ALL_ROLES = Object.freeze(Object.values(ROLES));

export const NAV_ITEMS = Object.freeze([
  { to: '/student', label: 'Dashboard', roles: [ROLES.STUDENT], end: true },
  { to: '/supervisor', label: 'Dashboard', roles: [ROLES.SUPERVISOR], end: true },
  { to: '/sub-admin', label: 'Dashboard', roles: [ROLES.SUB_ADMIN], end: true },
  { to: '/super-admin', label: 'Dashboard', roles: [ROLES.SUPER_ADMIN], end: true },
  {
    to: '/projects',
    label: 'Projects',
    labels: {
      [ROLES.STUDENT]: 'My projects',
      [ROLES.SUPERVISOR]: 'Assigned projects',
      [ROLES.SUB_ADMIN]: 'All projects',
      [ROLES.SUPER_ADMIN]: 'All projects'
    },
    roles: ALL_ROLES,
    end: true
  },
  { to: '/projects/new', label: 'New project', roles: [ROLES.STUDENT], end: true },
  { to: '/profile', label: 'Profile', roles: ALL_ROLES, end: true }
]);

export function navItemsForRole(role) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role)).map((item) => ({
    to: item.to,
    end: item.end,
    label: item.labels?.[role] ?? item.label
  }));
}
