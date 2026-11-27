import { ROLES } from '../../shared/constants/roles.js';
import { PROJECT_STAGE } from '../../shared/constants/statuses.js';
import { Project } from './project.model.js';
import { Team } from '../teams/team.model.js';
import { User } from '../users/user.model.js';
import { resolveProjectAccess } from './projectAccess.js';

const idOrNull = (value) => (value ? String(value) : null);

export function publicProject(project) {
  return {
    id: String(project.id ?? project._id),
    title: project.title,
    description: project.description ?? '',
    creatorId: String(project.creatorId),
    mode: project.mode,
    stage: project.stage,
    methodology: project.methodology ?? null,
    supervisorId: idOrNull(project.supervisorId),
    selectedIdeaId: idOrNull(project.selectedIdeaId),
    baselineRequirementsId: idOrNull(project.baselineRequirementsId),
    approvedTimelineId: idOrNull(project.approvedTimelineId),
    deadline: project.deadline ?? null,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  };
}

export function createProjectsService({ projectModel, teamModel, userModel }) {
  async function createProject(actor, { title, description, mode, deadline }) {
    const project = await projectModel.create({
      title,
      description: description ?? '',
      mode,
      deadline: deadline ?? null,
      creatorId: actor.id,
      stage: PROJECT_STAGE.IDEA_DISCOVERY
    });
    return publicProject(project);
  }

  async function visibilityFilter(actor) {
    switch (actor.role) {
      case ROLES.STUDENT: {
        const teams = await teamModel
          .find({ $or: [{ leaderId: actor.id }, { 'members.userId': actor.id }] })
          .select('projectId');
        return {
          $or: [{ creatorId: actor.id }, { _id: { $in: teams.map((team) => team.projectId) } }]
        };
      }
      case ROLES.SUPERVISOR:
        return { supervisorId: actor.id };
      case ROLES.SUB_ADMIN:
      case ROLES.SUPER_ADMIN:
        return {};
      default:
        return { _id: { $in: [] } };
    }
  }

  async function listProjects(actor, { page = 1, limit = 20, stage, mode } = {}) {
    const filter = {
      ...(await visibilityFilter(actor)),
      ...(stage ? { stage } : {}),
      ...(mode ? { mode } : {})
    };

    const [projects, total] = await Promise.all([
      projectModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      projectModel.countDocuments(filter)
    ]);

    const teams = projects.length
      ? await teamModel.find({ projectId: { $in: projects.map((project) => project._id) } })
      : [];
    const teamByProject = new Map(teams.map((team) => [String(team.projectId), team]));

    return {
      projects: projects.map((project) => ({
        ...publicProject(project),
        access:
          resolveProjectAccess({
            project,
            team: teamByProject.get(String(project._id)),
            user: actor
          }) ?? null
      })),
      page,
      limit,
      total
    };
  }

  async function getProject(project, access) {
    let supervisor = null;
    if (project.supervisorId) {
      const user = await userModel.findById(project.supervisorId);
      if (user) {
        supervisor = { id: String(user.id ?? user._id), fullName: user.fullName, email: user.email };
      }
    }
    return { ...publicProject(project), supervisor, access };
  }

  return { createProject, listProjects, getProject };
}

export const projectsService = createProjectsService({
  projectModel: Project,
  teamModel: Team,
  userModel: User
});
