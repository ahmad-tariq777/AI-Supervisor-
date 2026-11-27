import { PROJECT_ROLES, ROLES, isAdminRole } from '../../shared/constants/roles.js';

export const RELATIONS = Object.freeze({
  MEMBER: 'member',
  SUPERVISOR: 'supervisor',
  INSPECTOR: 'inspector'
});

const sameId = (a, b) => a !== undefined && a !== null && b !== undefined && b !== null && String(a) === String(b);

export function resolveProjectAccess({ project, team, user }) {
  if (!project || !user) return null;

  if (isAdminRole(user.role)) {
    return { relation: RELATIONS.INSPECTOR, projectRole: null };
  }

  if (user.role === ROLES.SUPERVISOR) {
    return sameId(project.supervisorId, user.id)
      ? { relation: RELATIONS.SUPERVISOR, projectRole: null }
      : null;
  }

  if (user.role === ROLES.STUDENT) {
    const leaderId = team?.leaderId ?? project.creatorId;
    if (sameId(leaderId, user.id)) {
      return { relation: RELATIONS.MEMBER, projectRole: PROJECT_ROLES.TEAM_LEADER };
    }

    const isCreator = sameId(project.creatorId, user.id);
    const isMember = (team?.members ?? []).some((member) => sameId(member.userId, user.id));
    if (isCreator || isMember) {
      return { relation: RELATIONS.MEMBER, projectRole: PROJECT_ROLES.TEAM_MEMBER };
    }
  }

  return null;
}
