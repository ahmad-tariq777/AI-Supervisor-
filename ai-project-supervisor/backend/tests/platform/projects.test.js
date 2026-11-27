import '../helpers/env.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeProjectModel } from '../helpers/fakeProjectModel.js';
import { createProjectsService } from '../../src/modules/projects/projects.service.js';
import { createProjectSchema } from '../../src/modules/projects/projects.validators.js';
import { Project } from '../../src/modules/projects/project.model.js';
import { PROJECT_MODE, PROJECT_STAGE } from '../../src/shared/constants/statuses.js';

const actor = { id: 'user-1', role: 'student' };

test('creating an individual project starts in Idea Discovery', async () => {
  const projectModel = createFakeProjectModel();
  const service = createProjectsService({ projectModel });
  const project = await service.createProject(actor, {
    title: 'Smart Attendance',
    mode: PROJECT_MODE.INDIVIDUAL
  });
  assert.equal(project.creatorId, 'user-1');
  assert.equal(project.mode, 'individual');
  assert.equal(project.stage, PROJECT_STAGE.IDEA_DISCOVERY);
  assert.equal(project.methodology, null);
  assert.equal(project.supervisorId, null);
  assert.equal(project.description, '');
  assert.equal(project.deadline, null);
});

test('creating a team project keeps the mode, description and deadline', async () => {
  const projectModel = createFakeProjectModel();
  const service = createProjectsService({ projectModel });
  const deadline = new Date('2099-01-01');
  const project = await service.createProject(actor, {
    title: 'Campus Navigator',
    description: 'Indoor maps',
    mode: PROJECT_MODE.TEAM,
    deadline
  });
  assert.equal(project.mode, 'team');
  assert.equal(project.description, 'Indoor maps');
  assert.equal(project.deadline, deadline);
  assert.equal(projectModel.projects.length, 1);
});

test('the creator comes from the session, never from the body', async () => {
  const projectModel = createFakeProjectModel();
  const service = createProjectsService({ projectModel });
  const parsed = createProjectSchema.safeParse({
    title: 'Hijack',
    mode: 'individual',
    creatorId: 'user-9'
  });
  assert.equal(parsed.success, false);
  const project = await service.createProject(actor, { title: 'Mine', mode: 'individual' });
  assert.equal(project.creatorId, 'user-1');
});

test('project schema trims the title and parses the deadline', () => {
  const parsed = createProjectSchema.parse({
    title: '  Smart Attendance  ',
    mode: 'team',
    deadline: '2099-06-30'
  });
  assert.equal(parsed.title, 'Smart Attendance');
  assert.ok(parsed.deadline instanceof Date);
});

test('project schema rejects bad titles, modes and deadlines', () => {
  const base = { title: 'Valid title', mode: 'individual' };
  assert.equal(createProjectSchema.safeParse({ ...base, title: 'ab' }).success, false);
  assert.equal(createProjectSchema.safeParse({ ...base, title: 'x'.repeat(151) }).success, false);
  assert.equal(createProjectSchema.safeParse({ mode: 'team' }).success, false);
  assert.equal(createProjectSchema.safeParse({ title: 'Valid title' }).success, false);
  assert.equal(createProjectSchema.safeParse({ ...base, mode: 'group' }).success, false);
  assert.equal(createProjectSchema.safeParse({ ...base, deadline: 'tomorrow' }).success, false);
  assert.equal(createProjectSchema.safeParse({ ...base, deadline: '2001-01-01' }).success, false);
  assert.equal(createProjectSchema.safeParse({ ...base, deadline: '2099-02-31' }).success, false);
});

test('project schema refuses fields that only the system may set', () => {
  const base = { title: 'Valid title', mode: 'individual' };
  for (const extra of [
    { stage: 'Completed' },
    { supervisorId: 'user-2' },
    { methodology: 'Kanban' },
    { selectedIdeaId: 'x' }
  ]) {
    assert.equal(createProjectSchema.safeParse({ ...base, ...extra }).success, false);
  }
});

test('project model validates required fields and applies defaults', () => {
  const missing = new Project({});
  const error = missing.validateSync();
  assert.ok(error.errors.title);
  assert.ok(error.errors.creatorId);
  assert.ok(error.errors.mode);

  const valid = new Project({
    title: 'Smart Attendance',
    mode: 'individual',
    creatorId: '64b7f0c2a1b2c3d4e5f60718'
  });
  assert.equal(valid.validateSync(), undefined);
  assert.equal(valid.stage, PROJECT_STAGE.IDEA_DISCOVERY);
  assert.equal(valid.methodology, null);
  assert.equal(valid.supervisorId, null);
  assert.equal(valid.deadline, null);

  const badMode = new Project({
    title: 'Smart Attendance',
    mode: 'group',
    creatorId: '64b7f0c2a1b2c3d4e5f60718'
  });
  assert.ok(badMode.validateSync().errors.mode);
});
