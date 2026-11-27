import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRole } from '../../middleware/authorizeRole.js';
import { validate } from '../../middleware/validate.js';
import { ROLE_VALUES } from '../../shared/constants/roles.js';
import * as controller from './users.controller.js';
import { changePasswordSchema, updateProfileSchema } from './users.validators.js';

const router = Router();

router.use(authenticate);

router.get('/me', authorizeRole(...ROLE_VALUES), controller.getMe);

router.patch(
  '/me',
  authorizeRole(...ROLE_VALUES),
  validate({ body: updateProfileSchema }),
  controller.updateMe
);

router.post(
  '/me/password',
  authorizeRole(...ROLE_VALUES),
  validate({ body: changePasswordSchema }),
  controller.changeMyPassword
);

export default router;
