import '../helpers/env.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeProjectModel } from '../helpers/fakeProjectModel.js';
import { createFakeTeamModel } from '../helpers/fakeTeamModel.js';
import { createProjectContext } from '../../src/middleware/projectContext.js';
import { RELATIONS, resolveProjectAccess } from '../../src/modules/projects/projectAccess.js';
import { ErrorCodes } from '../../src/shared/errors/errorCodes.js';
import { PROJECT_ROLES, ROLES } from '../../src/shared/constants/roles.js';

const student = (id) => ({ id, role: ROLES.STUDENT });

async function setup() {
  const projectModel = createFakeProjectModel();
  const teamModel = createFakeTeamModel();
  const projectContext = createProjectContext({ projectModel, teamModel });
  const project = await projectModel.create({
    title: 'Campus Navigator',
    mode: 'team',
    creatorId: 'leader',
    stage: 'Idea Discovery',
    supervisorId: 'sup-1'
  });
  teamModel.add({ projectId: project._id, leaderId: 'leader', members: ['member'] });
  return { projectModel, teamModel, projectContext, project };
}

function run(middleware, req) {
  return new Promise((resolve) => middleware(req, {}, (err) => resolve(err)));
}

test('resolveProjectAccess gives the creator of an individual project the leader role', () => {
  const project = { creatorId: 'u1', supervisorId: null };
  assert.deepEqual(resolveProjectAccess({ project, team: null, user: student('u1') }), {
    relation: RELATIONS.MEMBER,
    projectRole: PROJECT_ROLES.TEAM_LEADER
  });
});

test('resolveProjectAccess follows the team for leader and member roles', () => {
  const project = { creatorId: 'u1' };
  const team = { leaderId: 'u2', members: [{ userId: 'u3' }] };
  assert.equal(
    resolveProjectAccess({ project, team, user: student('u2') }).projectRole,
    PROJECT_ROLES.TEAM_LEADER
  );
  assert.equal(
    resolveProjectAccess({ project, team, user: student('u3') }).projectRole,
    PROJECT_ROLES.TEAM_MEMBER
  );
  assert.equal(
    resolveProjectAccess({ project, team, user: student('u1') }).projectRole,
    PROJECT_ROLES.TEAM_MEMBER
  );
  assert.equal(resolveProjectAccess({ project, team, user: student('u9') }), null);
});

test('resolveProjectAccess limits a supervisor to assigned projects', () => {
  const project = { creatorId: 'u1', supervisorId: 'sup-1' };
  const assigned = { id: 'sup-1', role: ROLES.SUPERVISOR };
  const other = { id: 'sup-2', role: ROLES.SUPERVISOR };
  assert.equal(resolveProjectAccess({ project, user: assigned }).relation, RELATIONS.SUPERVISOR);
  assert.equal(resolveProjectAccess({ project, user: other }), null);
  assert.equal(
    resolveProjectAccess({ project: { creatorId: 'u1', supervisorId: null }, user: assigned }),
    null
  );
});

test('resolveProjectAccess lets both admin roles inspect any project', () => {
  const project = { creatorId: 'u1' };
  for (const role of [ROLES.SUB_ADMIN, ROLES.SUPER_ADMIN]) {
    assert.deepEqual(resolveProjectAccess({ project, user: { id: 'a', role } }), {
      relation: RELATIONS.INSPECTOR,
      projectRole: null
    });
  }
});

test('a supervisor id on the project does not help a user whose account is not a supervisor', () => {
  const project = { creatorId: 'u1', supervisorId: 'x1' };
  assert.equal(resolveProjectAccess({ project, user: { id: 'x1', role: ROLES.STUDENT } }), null);
});

test('projectContext loads the project and the project-level role', async () => {
  const { projectContext, project } = await setup();
  const req = { user: student('member'), params: { id: project._id } };
  const err = await run(projectContext(), req);
  assert.equal(err, undefined);
  assert.equal(req.project, project);
  assert.equal(req.projectAccess.projectRole, PROJECT_ROLES.TEAM_MEMBER);
  assert.equal(req.projectTeam.leaderId, 'leader');
});

test('projectContext hides the project from users outside it', async () => {
  const { projectContext, project } = await setup();
  const err = await run(projectContext(), { user: student('stranger'), params: { id: project._id } });
  assert.equal(err.code, ErrorCodes.NOT_FOUND);
});

test('projectContext treats malformed and unknown ids as not found', async () => {
  const { projectContext } = await setup();
  for (const id of ['abc', '../etc', '{"$ne":null}', '0'.repeat(24), undefined]) {
    const err = await run(projectContext(), { user: student('leader'), params: { id } });
    assert.equal(err.code, ErrorCodes.NOT_FOUND);
  }
});

test('projectContext rejects an unauthenticated request', async () => {
  const { projectContext, project } = await setup();
  const err = await run(projectContext(), { params: { id: project._id } });
  assert.equal(err.code, ErrorCodes.AUTH_REQUIRED);
});

test('projectContext enforces a project-role restriction for members', async () => {
  const { projectContext, project } = await setup();
  const leaderOnly = projectContext({ projectRoles: [PROJECT_ROLES.TEAM_LEADER] });

  assert.equal(await run(leaderOnly, { user: student('leader'), params: { id: project._id } }), undefined);

  const err = await run(leaderOnly, { user: student('member'), params: { id: project._id } });
  assert.equal(err.code, ErrorCodes.FORBIDDEN);
});

test('projectContext can refuse supervisors and inspectors on write routes', async () => {
  const { projectContext, project } = await setup();
  const writeOnly = projectContext({ allowSupervisor: false, allowInspector: false });
  const supervisor = { id: 'sup-1', role: ROLES.SUPERVISOR };
  const admin = { id: 'adm', role: ROLES.SUB_ADMIN };

  for (const user of [supervisor, admin]) {
    const err = await run(writeOnly, { user, params: { id: project._id } });
    assert.equal(err.code, ErrorCodes.FORBIDDEN);
  }
  assert.equal(await run(projectContext(), { user: supervisor, params: { id: project._id } }), undefined);
  assert.equal(await run(projectContext(), { user: admin, params: { id: project._id } }), undefined);
});

test('projectContext rejects an invalid role list when the route is defined', async () => {
  const { projectContext } = await setup();
  assert.throws(() => projectContext({ projectRoles: [] }), TypeError);
  assert.throws(() => projectContext({ projectRoles: ['owner'] }), TypeError);
});
