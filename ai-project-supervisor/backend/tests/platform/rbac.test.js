import '../helpers/env.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authorizeRole } from '../../src/middleware/authorizeRole.js';
import { ErrorCodes } from '../../src/shared/errors/errorCodes.js';
import { ROLES } from '../../src/shared/constants/roles.js';

function run(middleware, req) {
  return new Promise((resolve) => {
    middleware(req, {}, (err) => resolve(err));
  });
}

test('authorizeRole lets an allowed role through', async () => {
  const guard = authorizeRole(ROLES.STUDENT, ROLES.SUPERVISOR);
  assert.equal(await run(guard, { user: { role: ROLES.STUDENT } }), undefined);
  assert.equal(await run(guard, { user: { role: ROLES.SUPERVISOR } }), undefined);
});

test('authorizeRole rejects a role that is not listed', async () => {
  const guard = authorizeRole(ROLES.SUPER_ADMIN);
  const err = await run(guard, { user: { role: ROLES.SUB_ADMIN } });
  assert.equal(err.code, ErrorCodes.FORBIDDEN);
  assert.equal(err.status, 403);
});

test('authorizeRole does not treat the Super Admin as a wildcard', async () => {
  const guard = authorizeRole(ROLES.STUDENT);
  const err = await run(guard, { user: { role: ROLES.SUPER_ADMIN } });
  assert.equal(err.code, ErrorCodes.FORBIDDEN);
});

test('authorizeRole rejects a request that was never authenticated', async () => {
  const err = await run(authorizeRole(ROLES.STUDENT), {});
  assert.equal(err.code, ErrorCodes.AUTH_REQUIRED);
  assert.equal(err.status, 401);
});

test('authorizeRole accepts an array of roles', async () => {
  const guard = authorizeRole([ROLES.STUDENT, ROLES.SUPERVISOR]);
  assert.equal(await run(guard, { user: { role: ROLES.SUPERVISOR } }), undefined);
});

test('authorizeRole fails fast on a missing or unknown role', () => {
  assert.throws(() => authorizeRole(), TypeError);
  assert.throws(() => authorizeRole('teacher'), TypeError);
  assert.throws(() => authorizeRole(undefined), TypeError);
});
