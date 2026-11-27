import { createQuery, matchFilter } from './matchFilter.js';

export function createFakeProjectModel() {
  const projects = [];
  let sequence = 0;

  return {
    projects,

    async create(data) {
      sequence += 1;
      const id = sequence.toString(16).padStart(24, '0');
      const now = new Date(Date.UTC(2026, 0, 1) + sequence * 1000);
      const doc = {
        _id: id,
        id,
        description: '',
        methodology: null,
        supervisorId: null,
        selectedIdeaId: null,
        baselineRequirementsId: null,
        approvedTimelineId: null,
        deadline: null,
        createdAt: now,
        updatedAt: now,
        ...data
      };
      projects.push(doc);
      return doc;
    },

    async findById(id) {
      return projects.find((project) => project._id === id) ?? null;
    },

    find(filter = {}) {
      return createQuery(projects.filter((project) => matchFilter(project, filter)));
    },

    async countDocuments(filter = {}) {
      return projects.filter((project) => matchFilter(project, filter)).length;
    }
  };
}
