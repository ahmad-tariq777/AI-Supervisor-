import '../helpers/env.js';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startHarness } from '../helpers/httpHarness.js';
import { ErrorCodes } from '../../src/shared/errors/errorCodes.js';
import { PROJECT_ROLES, ROLES } from '../../src/shared/constants/roles.js';

let harness;
let leader;
let member;
let stranger;
let supervisor;
let otherSupervisor;
let subAdmin;
let superAdmin;
let teamProject;
let soloProject;
let unrelatedProject;

before(async () => {
  harness = await startHarness();
  leader = await harness.addUser(ROLES.STUDENT, 'leader');
  member = await harness.addUser(ROLES.STUDENT, 'member');
  stranger = await harness.addUser(ROLES.STUDENT, 'stranger');
  supervisor = await harness.addUser(ROLES.SUPERVISOR, 'supervisor');
  otherSupervisor = await harness.addUser(ROLES.SUPERVISOR, 'othersupervisor');
  subAdmin = await harness.addUser(ROLES.SUB_ADMIN, 'subadmin');
  superAdmin = await harness.addUser(ROLES.SUPER_ADMIN, 'superadmin');

  teamProject = await harness.projectModel.create({
    title: 'Team project',
    mode: 'team',
    creatorId: leader.id,
    stage: 'Idea Discovery',
    supervisorId: supervisor.id
  });
  harness.teamModel.add({
    projectId: teamProject._id,
    leaderId: leader.id,
    members: [member.id]
  });
  soloProject = await harness.projectModel.create({
    title: 'Solo project',
    mode: 'individual',
    creatorId: stranger.id,
    stage: 'Execution'
  });
  unrelatedProject = await harness.projectModel.create({
    title: 'Unrelated project',
    mode: 'individual',
    creatorId: superAdmin.id,
    stage: 'Idea Discovery'
  });
});

after(async () => {
  await harness.close();
});

const PROTECTED = [
  ['GET', '/users/me'],
  ['PATCH', '/users/me'],
  ['POST', '/users/me/password'],
  ['GET', '/projects'],
  ['POST', '/projects'],
  ['GET', '/projects/000000000000000000000001']
];

test('every protected endpoint requires a valid access token', async () => {
  for (const [method, path] of PROTECTED) {
    const missing = await harness.request(path, { method, body: method === 'GET' ? undefined : {} });
    assert.equal(missing.status, 401, `${method} ${path} without a token`);
    assert.equal(missing.body.error.code, ErrorCodes.AUTH_REQUIRED);

    const garbage = await harness.request(path, {
      method,
      token: 'not.a.token',
      body: method === 'GET' ? undefined : {}
    });
    assert.equal(garbage.status, 401, `${method} ${path} with a bad token`);
  }
});

test('a deactivated account is refused even with a valid token', async () => {
  const gone = await harness.addUser(ROLES.STUDENT, 'gone');
  gone.isActive = false;
  const response = await harness.request('/projects', { user: gone });
  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, ErrorCodes.ACCOUNT_DEACTIVATED);
});

test('every human role can read its own profile', async () => {
  for (const user of [leader, supervisor, subAdmin, superAdmin]) {
    const response = await harness.request('/users/me', { user });
    assert.equal(response.status, 200);
    assert.equal(response.body.user.id, user.id);
    assert.equal(response.body.user.role, user.role);
    assert.equal('passwordHash' in response.body.user, false);
  }
});

test('profile updates cannot change role, email or active status', async () => {
  for (const body of [{ role: ROLES.SUPER_ADMIN }, { email: 'x@example.com' }, { isActive: false }]) {
    const response = await harness.request('/users/me', { method: 'PATCH', user: leader, body });
    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, ErrorCodes.VALIDATION_ERROR);
  }
  assert.equal(leader.role, ROLES.STUDENT);
});

test('technical skills are for students only', async () => {
  const body = { profile: { skills: ['React'] } };
  const ok = await harness.request('/users/me', { method: 'PATCH', user: leader, body });
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.body.user.profile.skills, ['React']);

  for (const user of [supervisor, subAdmin, superAdmin]) {
    const denied = await harness.request('/users/me', { method: 'PATCH', user, body });
    assert.equal(denied.status, 403);
    assert.equal(denied.body.error.code, ErrorCodes.FORBIDDEN);
  }
});

test('only students can create projects', async () => {
  const body = { title: 'New idea', mode: 'team' };

  const created = await harness.request('/projects', { method: 'POST', user: leader, body });
  assert.equal(created.status, 201);
  assert.equal(created.body.project.creatorId, leader.id);

  for (const user of [supervisor, subAdmin, superAdmin]) {
    const denied = await harness.request('/projects', { method: 'POST', user, body });
    assert.equal(denied.status, 403, `${user.role} must not create projects`);
  }
});

test('a project body cannot claim another creator, stage or supervisor', async () => {
  for (const extra of [{ creatorId: stranger.id }, { stage: 'Completed' }, { supervisorId: supervisor.id }]) {
    const response = await harness.request('/projects', {
      method: 'POST',
      user: leader,
      body: { title: 'Sneaky', mode: 'individual', ...extra }
    });
    assert.equal(response.status, 400);
  }
});

test('students list only the projects they lead, created or belong to', async () => {
  const idsFor = async (user) =>
    (await harness.request('/projects', { user })).body.projects.map((project) => project.id);

  const leaderIds = await idsFor(leader);
  assert.ok(leaderIds.includes(teamProject._id));
  assert.ok(!leaderIds.includes(soloProject._id));
  assert.ok(!leaderIds.includes(unrelatedProject._id));

  assert.ok((await idsFor(member)).includes(teamProject._id));
  assert.deepEqual(await idsFor(stranger), [soloProject._id]);
});

test('listed projects carry the caller project-level role', async () => {
  const asLeader = (await harness.request('/projects', { user: leader })).body.projects.find(
    (project) => project.id === teamProject._id
  );
  assert.equal(asLeader.access.projectRole, PROJECT_ROLES.TEAM_LEADER);

  const asMember = (await harness.request('/projects', { user: member })).body.projects.find(
    (project) => project.id === teamProject._id
  );
  assert.equal(asMember.access.projectRole, PROJECT_ROLES.TEAM_MEMBER);
});

test('a supervisor lists only assigned projects', async () => {
  const assigned = await harness.request('/projects', { user: supervisor });
  assert.deepEqual(
    assigned.body.projects.map((project) => project.id),
    [teamProject._id]
  );
  const none = await harness.request('/projects', { user: otherSupervisor });
  assert.deepEqual(none.body.projects, []);
  assert.equal(none.body.total, 0);
});

test('both admin roles list every project', async () => {
  for (const user of [subAdmin, superAdmin]) {
    const response = await harness.request('/projects', { user });
    assert.equal(response.status, 200);
    assert.equal(response.body.total, harness.projectModel.projects.length);
    assert.ok(response.body.projects.every((project) => project.access.relation === 'inspector'));
  }
});

test('project listing supports filters and pagination and rejects bad input', async () => {
  const filtered = await harness.request('/projects?stage=Execution', { user: superAdmin });
  assert.deepEqual(
    filtered.body.projects.map((project) => project.id),
    [soloProject._id]
  );

  const page = await harness.request('/projects?limit=1&page=2', { user: superAdmin });
  assert.equal(page.body.projects.length, 1);
  assert.equal(page.body.page, 2);
  assert.equal(page.body.limit, 1);

  for (const query of ['?limit=0', '?limit=101', '?page=0', '?stage=Nope', '?mode=group', '?role=x']) {
    const response = await harness.request(`/projects${query}`, { user: superAdmin });
    assert.equal(response.status, 400, query);
  }

  const injection = await harness.request('/projects?stage[$ne]=x', { user: superAdmin });
  assert.equal(injection.status, 400);
});

test('opening a project returns the caller access and project-level role', async () => {
  const asLeader = await harness.request(`/projects/${teamProject._id}`, { user: leader });
  assert.equal(asLeader.status, 200);
  assert.equal(asLeader.body.project.access.projectRole, PROJECT_ROLES.TEAM_LEADER);
  assert.equal(asLeader.body.project.supervisor.id, supervisor.id);

  const asMember = await harness.request(`/projects/${teamProject._id}`, { user: member });
  assert.equal(asMember.body.project.access.projectRole, PROJECT_ROLES.TEAM_MEMBER);

  const asSupervisor = await harness.request(`/projects/${teamProject._id}`, { user: supervisor });
  assert.equal(asSupervisor.status, 200);
  assert.equal(asSupervisor.body.project.access.relation, 'supervisor');
  assert.equal(asSupervisor.body.project.access.projectRole, null);

  for (const admin of [subAdmin, superAdmin]) {
    const asAdmin = await harness.request(`/projects/${teamProject._id}`, { user: admin });
    assert.equal(asAdmin.status, 200);
    assert.equal(asAdmin.body.project.access.relation, 'inspector');
  }
});

test('users outside a project cannot open it and cannot tell it exists', async () => {
  const outsiders = [
    [stranger, teamProject],
    [otherSupervisor, teamProject],
    [leader, soloProject],
    [member, unrelatedProject]
  ];
  for (const [user, project] of outsiders) {
    const response = await harness.request(`/projects/${project._id}`, { user });
    assert.equal(response.status, 404, `${user.role} should not see ${project.title}`);
    assert.equal(response.body.error.code, ErrorCodes.NOT_FOUND);
  }

  const missing = await harness.request('/projects/ffffffffffffffffffffffff', { user: leader });
  assert.equal(missing.status, 404);
  assert.equal(missing.body.error.message, 'Project not found');

  const malformed = await harness.request('/projects/not-an-id', { user: leader });
  assert.equal(malformed.status, 404);
});
