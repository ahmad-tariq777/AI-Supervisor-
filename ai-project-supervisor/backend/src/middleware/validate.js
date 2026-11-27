import { AppError } from '../shared/errors/AppError.js';

const SOURCES = ['params', 'query', 'body'];
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_DEPTH = 10;

function findUnsafeKey(value, path = '', depth = 0) {
  if (value === null || typeof value !== 'object') return null;
  if (depth > MAX_DEPTH) return path || 'value';

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findUnsafeKey(value[index], `${path}[${index}]`, depth + 1);
      if (found) return found;
    }
    return null;
  }

  for (const key of Object.keys(value)) {
    const keyPath = path ? `${path}.${key}` : key;
    if (key.startsWith('$') || key.includes('.') || FORBIDDEN_KEYS.has(key)) return keyPath;
    const found = findUnsafeKey(value[key], keyPath, depth + 1);
    if (found) return found;
  }
  return null;
}

function formatIssues(source, issues) {
  return issues.map((issue) => ({
    source,
    field: issue.path.join('.'),
    message: issue.message
  }));
}

export function validate(schemas) {
  return function validateRequest(req, res, next) {
    const details = [];

    for (const source of SOURCES) {
      const unsafe = findUnsafeKey(req[source]);
      if (unsafe) {
        return next(
          AppError.validation('The request contains characters that are not allowed', [
            { source, field: unsafe, message: 'This field name is not allowed' }
          ])
        );
      }
    }

    const parsed = {};
    for (const source of SOURCES) {
      const schema = schemas[source];
      if (!schema) continue;
      const result = schema.safeParse(req[source] ?? {});
      if (result.success) {
        parsed[source] = result.data;
      } else {
        details.push(...formatIssues(source, result.error.issues));
      }
    }

    if (details.length > 0) {
      return next(AppError.validation('The request is not valid', details));
    }

    for (const source of Object.keys(parsed)) {
      req[source] = parsed[source];
    }
    return next();
  };
}
