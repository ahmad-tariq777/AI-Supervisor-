import { Router } from 'express';
import { dbStatus } from '../config/db.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';
import authRouter from '../modules/auth/auth.routes.js';
import usersRouter from '../modules/users/users.routes.js';
import projectsRouter from '../modules/projects/projects.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/projects', projectsRouter);

router.get('/health/live', (req, res) => {
  res.json({ status: 'ok' });
});

router.get(
  '/health/ready',
  asyncHandler(async (req, res) => {
    const database = await dbStatus();
    const ready = database.connected;
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ok' : 'degraded',
      checks: { database }
    });
  })
);

export default router;
