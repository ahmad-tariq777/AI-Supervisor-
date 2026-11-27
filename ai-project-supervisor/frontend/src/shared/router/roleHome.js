export const ROLES = Object.freeze({
  STUDENT: 'student',
  SUPERVISOR: 'supervisor',
  SUB_ADMIN: 'sub_admin',
  SUPER_ADMIN: 'super_admin'
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.STUDENT]: 'Student',
  [ROLES.SUPERVISOR]: 'Supervisor',
  [ROLES.SUB_ADMIN]: 'Sub Admin',
  [ROLES.SUPER_ADMIN]: 'Super Admin'
});

const ROLE_HOME = Object.freeze({
  [ROLES.STUDENT]: '/student',
  [ROLES.SUPERVISOR]: '/supervisor',
  [ROLES.SUB_ADMIN]: '/sub-admin',
  [ROLES.SUPER_ADMIN]: '/super-admin'
});

export function roleHome(role) {
  return ROLE_HOME[role] ?? '/status';
}
