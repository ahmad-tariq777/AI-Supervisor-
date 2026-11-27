import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from '../config/env.js';

export const securityMiddleware = [
  helmet(),
  cors({ origin: env.FRONTEND_ORIGIN, credentials: true }),
  express.json({ limit: '1mb' })
];
