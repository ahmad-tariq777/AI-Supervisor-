export const ROLES = Object.freeze({
  STUDENT: 'student',
  SUPERVISOR: 'supervisor',
  SUB_ADMIN: 'sub_admin',
  SUPER_ADMIN: 'super_admin'
});

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));

export const PROJECT_ROLES = Object.freeze({
  TEAM_LEADER: 'team_leader',
  TEAM_MEMBER: 'team_member'
});

export const PROJECT_ROLE_VALUES = Object.freeze(Object.values(PROJECT_ROLES));

export const ADMIN_ROLES = Object.freeze([ROLES.SUB_ADMIN, ROLES.SUPER_ADMIN]);

export const ASSIGNABLE_ROLES = Object.freeze([
  ROLES.STUDENT,
  ROLES.SUPERVISOR,
  ROLES.SUB_ADMIN
]);

export const DEFAULT_ROLE = ROLES.STUDENT;

export const isRole = (value) => ROLE_VALUES.includes(value);

export const isAdminRole = (value) => ADMIN_ROLES.includes(value);