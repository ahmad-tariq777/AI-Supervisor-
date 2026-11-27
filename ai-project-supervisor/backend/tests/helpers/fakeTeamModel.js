import { createQuery, matchFilter } from './matchFilter.js';

export function createFakeTeamModel() {
  const teams = [];

  return {
    teams,

    add({ projectId, leaderId, members = [] }) {
      const team = {
        _id: `team-${teams.length + 1}`,
        projectId,
        leaderId,
        members: members.map((userId) => ({ userId, joinedAt: new Date() }))
      };
      teams.push(team);
      return team;
    },

    find(filter = {}) {
      return createQuery(teams.filter((team) => matchFilter(team, filter)));
    },

    async findOne(filter = {}) {
      return teams.find((team) => matchFilter(team, filter)) ?? null;
    }
  };
}
