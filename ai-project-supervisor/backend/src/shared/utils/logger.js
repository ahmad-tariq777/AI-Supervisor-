import { env } from '../../config/env.js';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const SENSITIVE_KEY = /pass(word)?|token|secret|authorization|cookie|api[-_]?key|service[-_]?key/i;
const MAX_DEPTH = 6;

function serializeError(err, depth = 0) {
  return {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack,
    cause:
      err.cause instanceof Error && depth < MAX_DEPTH
        ? serializeError(err.cause, depth + 1)
        : err.cause
  };
}

function redact(value, depth = 0) {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Error) return serializeError(value);
  if (depth >= MAX_DEPTH) return '[TRUNCATED]';
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    out[key] = SENSITIVE_KEY.test(key) ? '[REDACTED]' : redact(item, depth + 1);
  }
  return out;
}

function createLogger(bindings) {
  const write = (level, event, fields = {}) => {
    if (LEVELS[level] < LEVELS[env.LOG_LEVEL]) return;
    const line = {
      level,
      time: new Date().toISOString(),
      service: 'backend',
      environment: env.NODE_ENV,
      event,
      ...bindings,
      ...redact(fields)
    };
    const stream = level === 'error' ? process.stderr : process.stdout;
    stream.write(JSON.stringify(line) + '\n');
  };

  return {
    debug: (event, fields) => write('debug', event, fields),
    info: (event, fields) => write('info', event, fields),
    warn: (event, fields) => write('warn', event, fields),
    error: (event, fields) => write('error', event, fields),
    child: (extra) => createLogger({ ...bindings, ...extra })
  };
}

export const logger = createLogger({});
