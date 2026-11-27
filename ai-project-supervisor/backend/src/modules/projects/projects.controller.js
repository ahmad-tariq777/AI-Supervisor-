import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { projectsService } from './projects.service.js';

export const createProject = asyncHandler(async (req, res) => {
  const project = await projectsService.createProject(req.user, req.body);
  req.log.info('projects.created', { projectId: project.id, mode: project.mode });
  res.status(201).json({ project });
});

export const listProjects = asyncHandler(async (req, res) => {
  const result = await projectsService.listProjects(req.user, req.query);
  res.status(200).json(result);
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await projectsService.getProject(req.project, req.projectAccess);
  res.status(200).json({ project });
});
