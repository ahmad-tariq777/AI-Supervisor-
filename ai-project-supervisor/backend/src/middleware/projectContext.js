import { AppError } from '../shared/errors/AppError.js';
import { PROJECT_ROLE_VALUES } from '../shared/constants/roles.js';
import { RELATIONS, resolveProjectAccess } from '../modules/projects/projectAccess.js';
import { Project } from '../modules/projects/project.model.js';
import { Team } from '../modules/teams/team.model.js';

const OBJECT_ID = /^[0-9a-f]{24}$/i;
const NOT_FOUND_MESSAGE = 'Project not found';

export function createProjectContext({ projectModel, teamModel }) {
  return function projectContext({
    projectRoles,
    allowSupervisor = true,
    allowInspector = true,
    param = 'id'
  } = {}) {
    if (projectRoles !== undefined) {
      const unknown = projectRoles.filter((role) => !PROJECT_ROLE_VALUES.includes(role));
      if (projectRoles.length === 0 || unknown.length > 0) {
        throw new TypeError('projectContext received an invalid projectRoles list');
      }
    }

    return async function loadProjectContext(req, res, next) {
      try {
        if (!req.user) throw AppError.unauthenticated();

        const projectId = req.params?.[param];
        if (typeof projectId !== 'string' || !OBJECT_ID.test(projectId)) {
          throw AppError.notFound(NOT_FOUND_MESSAGE);
        }

        const project = await projectModel.findById(projectId);
        if (!project) throw AppError.notFound(NOT_FOUND_MESSAGE);

        const team = await teamModel.findOne({ projectId: project._id });
        const access = resolveProjectAccess({ project, team, user: req.user });
        if (!access) throw AppError.notFound(NOT_FOUND_MESSAGE);

        if (access.relation === RELATIONS.MEMBER) {
          if (projectRoles && !projectRoles.includes(access.projectRole)) {
            throw AppError.forbidden();
          }
        } else if (access.relation === RELATIONS.SUPERVISOR && !allowSupervisor) {
          throw AppError.forbidden();
        } else if (access.relation === RELATIONS.INSPECTOR && !allowInspector) {
          throw AppError.forbidden();
        }

        req.project = project;
        req.projectTeam = team ?? null;
        req.projectAccess = access;
        req.log = req.log?.child({ projectId });
        next();
      } catch (err) {
        next(err);
      }
    };
  };
}

export const projectContext = createProjectContext({ projectModel: Project, teamModel: Team });
