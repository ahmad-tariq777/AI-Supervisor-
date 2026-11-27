import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import * as controller from './auth.controller.js';
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema
} from './auth.validators.js';

const router = Router();

router.post('/register', validate({ body: registerSchema }), controller.register);
router.post('/login', validate({ body: loginSchema }), controller.login);
router.post('/refresh', validate({ body: refreshSchema }), controller.refresh);
router.post('/logout', validate({ body: logoutSchema }), controller.logout);

export default router;
