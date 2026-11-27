import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    MONGODB_URI: z.string().min(1),
    JWT_SECRET: z.string().min(16),
    JWT_REFRESH_SECRET: z.string().min(16),
    ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().positive().default(15),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().positive().default(7),
    AI_SERVICE_URL: z.string().url().default('http://127.0.0.1:8000'),
    AI_SERVICE_KEY: z.string().min(8),
    GITHUB_TOKEN: z.string().optional(),
    CERT_BASE_URL: z.string().url().optional()
  })
  .refine((values) => values.JWT_SECRET !== values.JWT_REFRESH_SECRET, {
    message: 'JWT_SECRET and JWT_REFRESH_SECRET must be different',
    path: ['JWT_REFRESH_SECRET']
  });

const raw = Object.fromEntries(
  Object.entries(process.env).filter(([, value]) => value !== '')
);

const parsed = schema.safeParse(raw);

if (!parsed.success) {
  const problems = parsed.error.issues.map((issue) => ({
    variable: issue.path.join('.'),
    problem: issue.message
  }));
  process.stderr.write(
    JSON.stringify({ level: 'error', event: 'config.invalid', problems }) + '\n'
  );
  process.exit(1);
}

export const env = Object.freeze(parsed.data);
