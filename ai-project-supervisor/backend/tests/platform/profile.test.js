import '../helpers/env.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeUserModel } from '../helpers/fakeUserModel.js';
import { createUsersService } from '../../src/modules/users/users.service.js';
import {
  changePasswordSchema,
  updateProfileSchema
} from '../../src/modules/users/users.validators.js';
import { ErrorCodes } from '../../src/shared/errors/errorCodes.js';
import { ROLES } from '../../src/shared/constants/roles.js';

const fastHash = async (value) => `hash:${value}`;
const fastVerify = async (value, stored) => stored === `hash:${value}`;

async function setup(role = ROLES.STUDENT) {
  const userModel = createFakeUserModel();
  const service = createUsersService({ userModel, hash: fastHash, verify: fastVerify });
  const user = await userModel.create({
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    passwordHash: 'hash:OldPassw0rd',
    role
  });
  user.refreshSessions = [{ tokenHash: 'a', expiresAt: new Date() }];
  return { userModel, service, user, actor: { id: user.id, role } };
}

test('getProfile returns the public shape without secrets', async () => {
  const { service, user } = await setup();
  const profile = await service.getProfile(user.id);
  assert.equal(profile.email, 'ada@example.com');
  assert.deepEqual(profile.profile, { skills: [] });
  assert.equal('passwordHash' in profile, false);
  assert.equal('refreshSessions' in profile, false);
});

test('getProfile reports a missing user', async () => {
  const { service } = await setup();
  await assert.rejects(() => service.getProfile('nobody'), { code: ErrorCodes.NOT_FOUND });
});

test('updateProfile changes the name', async () => {
  const { service, actor } = await setup();
  const updated = await service.updateProfile(actor, { fullName: 'Ada King' });
  assert.equal(updated.fullName, 'Ada King');
});

test('a student can store technical skills', async () => {
  const { service, actor } = await setup();
  const updated = await service.updateProfile(actor, {
    profile: { skills: ['React', 'Node.js'] }
  });
  assert.deepEqual(updated.profile.skills, ['React', 'Node.js']);
});

test('only students can store technical skills', async () => {
  const { service, actor } = await setup(ROLES.SUPERVISOR);
  await assert.rejects(
    () => service.updateProfile(actor, { profile: { skills: ['React'] } }),
    { code: ErrorCodes.FORBIDDEN }
  );
  const renamed = await service.updateProfile(actor, { fullName: 'Prof Ada' });
  assert.equal(renamed.fullName, 'Prof Ada');
});

test('profile schema trims, de-duplicates and bounds skills', () => {
  const parsed = updateProfileSchema.parse({
    profile: { skills: [' React ', 'react', 'Node.js', 'REACT'] }
  });
  assert.deepEqual(parsed.profile.skills, ['React', 'Node.js']);

  assert.equal(updateProfileSchema.safeParse({ profile: { skills: [''] } }).success, false);
  assert.equal(
    updateProfileSchema.safeParse({ profile: { skills: ['x'.repeat(51)] } }).success,
    false
  );
  const tooMany = Array.from({ length: 51 }, (_, index) => `skill-${index}`);
  assert.equal(updateProfileSchema.safeParse({ profile: { skills: tooMany } }).success, false);
});

test('profile schema rejects empty bodies and fields a user must not set', () => {
  assert.equal(updateProfileSchema.safeParse({}).success, false);
  assert.equal(updateProfileSchema.safeParse({ role: 'super_admin' }).success, false);
  assert.equal(updateProfileSchema.safeParse({ email: 'x@example.com' }).success, false);
  assert.equal(updateProfileSchema.safeParse({ isActive: false }).success, false);
  assert.equal(updateProfileSchema.safeParse({ fullName: 'A' }).success, false);
});

test('changePassword stores the new hash and revokes every session', async () => {
  const { service, user } = await setup();
  await service.changePassword(user.id, {
    currentPassword: 'OldPassw0rd',
    newPassword: 'NewPassw0rd'
  });
  assert.equal(user.passwordHash, 'hash:NewPassw0rd');
  assert.deepEqual(user.refreshSessions, []);
});

test('changePassword rejects a wrong current password and changes nothing', async () => {
  const { service, user } = await setup();
  await assert.rejects(
    () => service.changePassword(user.id, { currentPassword: 'Wrong1234', newPassword: 'NewPassw0rd' }),
    (err) => {
      assert.equal(err.code, ErrorCodes.VALIDATION_ERROR);
      assert.equal(err.details[0].field, 'currentPassword');
      return true;
    }
  );
  assert.equal(user.passwordHash, 'hash:OldPassw0rd');
  assert.equal(user.refreshSessions.length, 1);
});

test('changePassword rejects reusing the current password', async () => {
  const { service, user } = await setup();
  await assert.rejects(
    () => service.changePassword(user.id, { currentPassword: 'OldPassw0rd', newPassword: 'OldPassw0rd' }),
    (err) => err.code === ErrorCodes.VALIDATION_ERROR && err.details[0].field === 'newPassword'
  );
});

test('password schema applies the registration password rules', () => {
  const ok = changePasswordSchema.safeParse({ currentPassword: 'x', newPassword: 'Valid1234' });
  assert.equal(ok.success, true);
  assert.equal(
    changePasswordSchema.safeParse({ currentPassword: 'x', newPassword: 'short1' }).success,
    false
  );
  assert.equal(
    changePasswordSchema.safeParse({ currentPassword: 'x', newPassword: 'nodigitshere' }).success,
    false
  );
  assert.equal(changePasswordSchema.safeParse({ newPassword: 'Valid1234' }).success, false);
});
