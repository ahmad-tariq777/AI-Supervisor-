import '../helpers/env.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeUserModel } from '../helpers/fakeUserModel.js';
import { createAuthService } from '../../src/modules/auth/auth.service.js';
import { createTokenService } from '../../src/modules/auth/token.service.js';
import {
  loginSchema,
  registerSchema
} from '../../src/modules/auth/auth.validators.js';
import { createAuthenticate } from '../../src/middleware/authenticate.js';
import { validate } from '../../src/middleware/validate.js';
import { ErrorCodes } from '../../src/shared/errors/errorCodes.js';
import { ROLES } from '../../src/shared/constants/roles.js';
import { JwtError, signJwt, verifyJwt } from '../../src/shared/utils/jwt.js';
import { hashPassword, verifyPassword } from '../../src/shared/utils/password.js';

const ACCESS_SECRET = 'access-secret-for-unit-tests-123456';
const REFRESH_SECRET = 'refresh-secret-for-unit-tests-654321';
const VALID_PASSWORD = 'Sup3rSecret!';

function buildTokens(clock = Date.now) {
  return createTokenService({
    accessSecret: ACCESS_SECRET,
    refreshSecret: REFRESH_SECRET,
    accessTtlSeconds: 900,
    refreshTtlSeconds: 604800,
    clock
  });
}

function buildService(clock) {
  const userModel = createFakeUserModel();
  const tokens = buildTokens(clock);
  const service = createAuthService({ userModel, tokens });
  return { userModel, tokens, service };
}

async function rejectsWithCode(promiseOrFn, code) {
  await assert.rejects(
    async () => (typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn),
    (err) => {
      assert.equal(err.code, code);
      return true;
    }
  );
}

test('hashPassword produces a salted hash that verifies', async () => {
  const first = await hashPassword(VALID_PASSWORD);
  const second = await hashPassword(VALID_PASSWORD);
  assert.notEqual(first, second);
  assert.ok(first.startsWith('scrypt$'));
  assert.ok(!first.includes(VALID_PASSWORD));
  assert.equal(await verifyPassword(VALID_PASSWORD, first), true);
  assert.equal(await verifyPassword(VALID_PASSWORD, second), true);
});

test('verifyPassword rejects a wrong password and malformed hashes', async () => {
  const stored = await hashPassword(VALID_PASSWORD);
  assert.equal(await verifyPassword('wrong-password-1', stored), false);
  assert.equal(await verifyPassword(VALID_PASSWORD, 'not-a-hash'), false);
  assert.equal(await verifyPassword(VALID_PASSWORD, 'scrypt$x$8$1$AAAA$AAAA'), false);
  assert.equal(await verifyPassword(VALID_PASSWORD, undefined), false);
  assert.equal(await verifyPassword(undefined, stored), false);
});

test('jwt round trip returns the payload', () => {
  const token = signJwt({ sub: 'abc' }, ACCESS_SECRET, { expiresInSeconds: 60 });
  const payload = verifyJwt(token, ACCESS_SECRET);
  assert.equal(payload.sub, 'abc');
  assert.ok(payload.exp > payload.iat);
});

test('jwt rejects a wrong secret, tampering and expiry', () => {
  const token = signJwt({ sub: 'abc', role: 'student' }, ACCESS_SECRET, { expiresInSeconds: 60 });

  assert.throws(() => verifyJwt(token, REFRESH_SECRET), (err) => err.reason === 'bad_signature');

  const [header, , signature] = token.split('.');
  const forgedBody = Buffer.from(
    JSON.stringify({ sub: 'abc', role: 'super_admin', exp: 9999999999 })
  ).toString('base64url');
  assert.throws(
    () => verifyJwt(`${header}.${forgedBody}.${signature}`, ACCESS_SECRET),
    (err) => err.reason === 'bad_signature'
  );

  assert.throws(
    () => verifyJwt(token, ACCESS_SECRET, { now: Date.now() + 61000 }),
    (err) => err instanceof JwtError && err.reason === 'expired'
  );
});

test('jwt rejects the none algorithm and malformed tokens', () => {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ sub: 'abc', exp: 9999999999 })).toString('base64url');
  assert.throws(() => verifyJwt(`${header}.${body}.`, ACCESS_SECRET), JwtError);
  assert.throws(() => verifyJwt('only.two', ACCESS_SECRET), JwtError);
  assert.throws(() => verifyJwt(undefined, ACCESS_SECRET), JwtError);
});

test('token service keeps access and refresh tokens apart', () => {
  const tokens = buildTokens();
  const user = { _id: 'u1', role: ROLES.STUDENT };
  const access = tokens.signAccessToken(user);
  const refresh = tokens.signRefreshToken(user);

  assert.equal(tokens.verifyAccessToken(access).role, ROLES.STUDENT);
  assert.equal(tokens.verifyRefreshToken(refresh.token).jti, refresh.jti);

  assert.throws(() => tokens.verifyAccessToken(refresh.token), { code: ErrorCodes.TOKEN_INVALID });
  assert.throws(() => tokens.verifyRefreshToken(access), { code: ErrorCodes.TOKEN_INVALID });
});

test('token service reports an expired token with its own code', () => {
  let now = Date.now();
  const tokens = buildTokens(() => now);
  const access = tokens.signAccessToken({ _id: 'u1', role: ROLES.STUDENT });
  now += 901 * 1000;
  assert.throws(() => tokens.verifyAccessToken(access), { code: ErrorCodes.TOKEN_EXPIRED });
});

test('token service hashes the refresh token id deterministically', () => {
  const tokens = buildTokens();
  assert.equal(tokens.hashJti('abc'), tokens.hashJti('abc'));
  assert.notEqual(tokens.hashJti('abc'), tokens.hashJti('abd'));
  assert.equal(tokens.hashJti('abc').length, 64);
});

test('register schema normalizes the email and rejects weak passwords', () => {
  const ok = registerSchema.safeParse({
    fullName: '  Ayesha Khan ',
    email: '  Ayesha@Example.COM ',
    password: VALID_PASSWORD
  });
  assert.equal(ok.success, true);
  assert.equal(ok.data.email, 'ayesha@example.com');
  assert.equal(ok.data.fullName, 'Ayesha Khan');

  const base = { fullName: 'Ayesha Khan', email: 'a@example.com' };
  assert.equal(registerSchema.safeParse({ ...base, password: 'short1' }).success, false);
  assert.equal(registerSchema.safeParse({ ...base, password: 'onlyletters' }).success, false);
  assert.equal(registerSchema.safeParse({ ...base, password: '1234567890' }).success, false);
  assert.equal(registerSchema.safeParse({ ...base, password: 'a1'.repeat(65) }).success, false);
});

test('register schema rejects unknown fields such as role', () => {
  const result = registerSchema.safeParse({
    fullName: 'Ayesha Khan',
    email: 'a@example.com',
    password: VALID_PASSWORD,
    role: ROLES.SUPER_ADMIN
  });
  assert.equal(result.success, false);
});

function runValidate(schemas, req) {
  return new Promise((resolve) => {
    validate(schemas)(req, {}, (err) => resolve(err ?? null));
  });
}

test('validate passes clean input and replaces the body with parsed data', async () => {
  const req = { body: { email: ' A@Example.com ', password: 'whatever' } };
  const err = await runValidate({ body: loginSchema }, req);
  assert.equal(err, null);
  assert.equal(req.body.email, 'a@example.com');
});

test('validate reports field errors in details', async () => {
  const req = { body: { email: 'nope', password: '' } };
  const err = await runValidate({ body: loginSchema }, req);
  assert.equal(err.code, ErrorCodes.VALIDATION_ERROR);
  const fields = err.details.map((detail) => detail.field).sort();
  assert.deepEqual(fields, ['email', 'password']);
});

test('validate blocks NoSQL operator keys at any depth', async () => {
  const direct = await runValidate({ body: loginSchema }, {
    body: { email: { $ne: null }, password: 'x' }
  });
  assert.equal(direct.code, ErrorCodes.VALIDATION_ERROR);
  assert.equal(direct.details[0].field, 'email.$ne');

  const nested = await runValidate({}, { body: { filter: { and: [{ $gt: 1 }] } } });
  assert.equal(nested.code, ErrorCodes.VALIDATION_ERROR);

  const dotted = await runValidate({}, { body: { 'profile.role': 'super_admin' } });
  assert.equal(dotted.code, ErrorCodes.VALIDATION_ERROR);

  const query = await runValidate({}, { query: { email: { $regex: '.*' } } });
  assert.equal(query.code, ErrorCodes.VALIDATION_ERROR);
});

test('validate blocks prototype pollution keys', async () => {
  const body = JSON.parse('{"__proto__": {"role": "super_admin"}}');
  const err = await runValidate({}, { body });
  assert.equal(err.code, ErrorCodes.VALIDATION_ERROR);
});

test('register creates a Student and never returns the password hash', async () => {
  const { service, userModel } = buildService();
  const result = await service.register({
    fullName: 'Ayesha Khan',
    email: 'ayesha@example.com',
    password: VALID_PASSWORD,
    role: ROLES.SUPER_ADMIN
  });

  assert.equal(result.user.role, ROLES.STUDENT);
  assert.equal(result.user.email, 'ayesha@example.com');
  assert.ok(!('passwordHash' in result.user));
  assert.equal(userModel.users.length, 1);
  assert.notEqual(userModel.users[0].passwordHash, VALID_PASSWORD);
  assert.ok(userModel.users[0].passwordHash.startsWith('scrypt$'));
});

test('register rejects a duplicate email with a conflict', async () => {
  const { service } = buildService();
  const input = { fullName: 'Ayesha Khan', email: 'ayesha@example.com', password: VALID_PASSWORD };
  await service.register(input);
  await rejectsWithCode(service.register(input), ErrorCodes.CONFLICT);
});

test('login returns a session for correct credentials', async () => {
  const { service, tokens, userModel } = buildService();
  await service.register({
    fullName: 'Ayesha Khan',
    email: 'ayesha@example.com',
    password: VALID_PASSWORD
  });

  const session = await service.login({ email: 'ayesha@example.com', password: VALID_PASSWORD });

  assert.equal(session.tokenType, 'Bearer');
  assert.equal(session.expiresIn, 900);
  assert.equal(session.user.role, ROLES.STUDENT);
  assert.ok(!('passwordHash' in session.user));
  assert.equal(tokens.verifyAccessToken(session.accessToken).sub, userModel.users[0]._id);
  assert.equal(userModel.users[0].refreshSessions.length, 1);
});

test('login gives the same error for a wrong password and an unknown email', async () => {
  const { service } = buildService();
  await service.register({
    fullName: 'Ayesha Khan',
    email: 'ayesha@example.com',
    password: VALID_PASSWORD
  });

  await rejectsWithCode(
    service.login({ email: 'ayesha@example.com', password: 'Wrong-pass-1' }),
    ErrorCodes.INVALID_CREDENTIALS
  );
  await rejectsWithCode(
    service.login({ email: 'nobody@example.com', password: VALID_PASSWORD }),
    ErrorCodes.INVALID_CREDENTIALS
  );
});

test('login rejects a deactivated account', async () => {
  const { service, userModel } = buildService();
  await service.register({
    fullName: 'Ayesha Khan',
    email: 'ayesha@example.com',
    password: VALID_PASSWORD
  });
  userModel.users[0].isActive = false;

  await rejectsWithCode(
    service.login({ email: 'ayesha@example.com', password: VALID_PASSWORD }),
    ErrorCodes.ACCOUNT_DEACTIVATED
  );
});

test('a deactivated account with a wrong password still sees invalid credentials', async () => {
  const { service, userModel } = buildService();
  await service.register({
    fullName: 'Ayesha Khan',
    email: 'ayesha@example.com',
    password: VALID_PASSWORD
  });
  userModel.users[0].isActive = false;

  await rejectsWithCode(
    service.login({ email: 'ayesha@example.com', password: 'Wrong-pass-1' }),
    ErrorCodes.INVALID_CREDENTIALS
  );
});

async function registeredSession(context) {
  await context.service.register({
    fullName: 'Ayesha Khan',
    email: 'ayesha@example.com',
    password: VALID_PASSWORD
  });
  return context.service.login({ email: 'ayesha@example.com', password: VALID_PASSWORD });
}

test('refresh rotates the refresh token and issues a new access token', async () => {
  const context = buildService();
  const first = await registeredSession(context);

  const second = await context.service.refresh({ refreshToken: first.refreshToken });

  assert.notEqual(second.refreshToken, first.refreshToken);
  assert.ok(second.accessToken);
  assert.equal(second.user.email, 'ayesha@example.com');
  assert.equal(context.userModel.users[0].refreshSessions.length, 1);
});

test('reusing a rotated refresh token revokes every session', async () => {
  const context = buildService();
  const first = await registeredSession(context);
  const second = await context.service.refresh({ refreshToken: first.refreshToken });

  await rejectsWithCode(
    context.service.refresh({ refreshToken: first.refreshToken }),
    ErrorCodes.TOKEN_INVALID
  );
  assert.equal(context.userModel.users[0].refreshSessions.length, 0);

  await rejectsWithCode(
    context.service.refresh({ refreshToken: second.refreshToken }),
    ErrorCodes.TOKEN_INVALID
  );
});

test('refresh rejects an access token, garbage and an expired token', async () => {
  let now = Date.now();
  const context = buildService(() => now);
  const session = await registeredSession(context);

  await rejectsWithCode(
    context.service.refresh({ refreshToken: session.accessToken }),
    ErrorCodes.TOKEN_INVALID
  );
  await rejectsWithCode(
    context.service.refresh({ refreshToken: 'garbage' }),
    ErrorCodes.TOKEN_INVALID
  );

  now += 8 * 24 * 60 * 60 * 1000;
  await rejectsWithCode(
    context.service.refresh({ refreshToken: session.refreshToken }),
    ErrorCodes.TOKEN_EXPIRED
  );
});

test('refresh rejects an account deactivated after login', async () => {
  const context = buildService();
  const session = await registeredSession(context);
  context.userModel.users[0].isActive = false;

  await rejectsWithCode(
    context.service.refresh({ refreshToken: session.refreshToken }),
    ErrorCodes.ACCOUNT_DEACTIVATED
  );
});

test('logout ends the session and is safe to repeat', async () => {
  const context = buildService();
  const session = await registeredSession(context);

  await context.service.logout({ refreshToken: session.refreshToken });
  assert.equal(context.userModel.users[0].refreshSessions.length, 0);

  await context.service.logout({ refreshToken: session.refreshToken });
  await context.service.logout({ refreshToken: 'garbage' });

  await rejectsWithCode(
    context.service.refresh({ refreshToken: session.refreshToken }),
    ErrorCodes.TOKEN_INVALID
  );
});

test('a user keeps at most ten refresh sessions', async () => {
  const context = buildService();
  await context.service.register({
    fullName: 'Ayesha Khan',
    email: 'ayesha@example.com',
    password: VALID_PASSWORD
  });
  for (let index = 0; index < 12; index += 1) {
    await context.service.login({ email: 'ayesha@example.com', password: VALID_PASSWORD });
  }
  assert.equal(context.userModel.users[0].refreshSessions.length, 10);
});

function runAuthenticate(authenticate, headers = {}) {
  const req = { get: (name) => headers[name.toLowerCase()] };
  return new Promise((resolve) => {
    authenticate(req, {}, (err) => resolve({ err: err ?? null, req }));
  });
}

function buildAuthenticate(users, clock) {
  const tokens = buildTokens(clock);
  const authenticate = createAuthenticate({
    tokens,
    findUserById: async (id) => users.find((user) => user._id === id) ?? null
  });
  return { tokens, authenticate };
}

test('authenticate rejects a missing or malformed header', async () => {
  const { authenticate } = buildAuthenticate([]);
  assert.equal((await runAuthenticate(authenticate)).err.code, ErrorCodes.AUTH_REQUIRED);
  assert.equal(
    (await runAuthenticate(authenticate, { authorization: 'Basic abc' })).err.code,
    ErrorCodes.AUTH_REQUIRED
  );
  assert.equal(
    (await runAuthenticate(authenticate, { authorization: 'Bearer not.a.jwt' })).err.code,
    ErrorCodes.TOKEN_INVALID
  );
});

test('authenticate sets req.user for an active account', async () => {
  const users = [
    { _id: 'u1', email: 'a@example.com', fullName: 'Ayesha', role: ROLES.SUPERVISOR, isActive: true }
  ];
  const { tokens, authenticate } = buildAuthenticate(users);
  const token = tokens.signAccessToken(users[0]);

  const { err, req } = await runAuthenticate(authenticate, { authorization: `Bearer ${token}` });

  assert.equal(err, null);
  assert.deepEqual(req.user, {
    id: 'u1',
    email: 'a@example.com',
    fullName: 'Ayesha',
    role: ROLES.SUPERVISOR
  });
});

test('authenticate rejects a deactivated account holding a valid token', async () => {
  const users = [
    { _id: 'u1', email: 'a@example.com', fullName: 'Ayesha', role: ROLES.STUDENT, isActive: true }
  ];
  const { tokens, authenticate } = buildAuthenticate(users);
  const token = tokens.signAccessToken(users[0]);
  users[0].isActive = false;

  const { err } = await runAuthenticate(authenticate, { authorization: `Bearer ${token}` });
  assert.equal(err.code, ErrorCodes.ACCOUNT_DEACTIVATED);
});

test('authenticate rejects a token whose user no longer exists', async () => {
  const users = [{ _id: 'u1', role: ROLES.STUDENT, isActive: true }];
  const { tokens, authenticate } = buildAuthenticate(users);
  const token = tokens.signAccessToken(users[0]);
  users.length = 0;

  const { err } = await runAuthenticate(authenticate, { authorization: `Bearer ${token}` });
  assert.equal(err.code, ErrorCodes.TOKEN_INVALID);
});

test('authenticate reports an expired access token', async () => {
  let now = Date.now();
  const users = [{ _id: 'u1', role: ROLES.STUDENT, isActive: true }];
  const { tokens, authenticate } = buildAuthenticate(users, () => now);
  const token = tokens.signAccessToken(users[0]);
  now += 901 * 1000;

  const { err } = await runAuthenticate(authenticate, { authorization: `Bearer ${token}` });
  assert.equal(err.code, ErrorCodes.TOKEN_EXPIRED);
});
