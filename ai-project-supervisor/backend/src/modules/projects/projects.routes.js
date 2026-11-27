import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRole } from '../../middleware/authorizeRole.js';
import { projectContext } from '../../middleware/projectContext.js';
import { validate } from '../../middleware/validate.js';
import { ROLES, ROLE_VALUES } from '../../shared/constants/roles.js';
import * as controller from './projects.controller.js';
import { createProjectSchema, listProjectsQuerySchema } from './projects.validators.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorizeRole(...ROLE_VALUES),
  validate({ query: listProjectsQuerySchema }),
  controller.listProjects
);

router.post(
  '/',
  authorizeRole(ROLES.STUDENT),
  validate({ body: createProjectSchema }),
  controller.createProject
);

router.get('/:id', authorizeRole(...ROLE_VALUES), projectContext(), controller.getProject);

export default router;
