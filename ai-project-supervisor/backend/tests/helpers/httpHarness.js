import '../helpers/env.js';
import { once } from 'node:events';
import { createFakeUserModel } from './fakeUserModel.js';
import { createFakeProjectModel } from './fakeProjectModel.js';
import { createFakeTeamModel } from './fakeTeamModel.js';

const PATCHED = {
  User: ['findById', 'findByIdAndUpdate', 'updateOne'],
  Project: ['create', 'findById', 'find', 'countDocuments'],
  Team: ['find', 'findOne']
};

export async function startHarness() {
  const { createApp } = await import('../../src/app.js');
  const { User } = await import('../../src/modules/users/user.model.js');
  const { Project } = await import('../../src/modules/projects/project.model.js');
  const { Team } = await import('../../src/modules/teams/team.model.js');
  const { tokenService } = await import('../../src/modules/auth/token.service.js');

  const userModel = createFakeUserModel();
  const projectModel = createFakeProjectModel();
  const teamModel = createFakeTeamModel();

  const targets = [
    [User, userModel, PATCHED.User],
    [Project, projectModel, PATCHED.Project],
    [Team, teamModel, PATCHED.Team]
  ];
  for (const [model, fake, methods] of targets) {
    for (const method of methods) {
      model[method] = (...args) => fake[method](...args);
    }
  }

  const server = createApp().listen(0);
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;

  async function addUser(role, name = role) {
    return userModel.create({
      fullName: `Test ${name}`,
      email: `${name}@example.com`,
      passwordHash: 'unused',
      role
    });
  }

  async function request(path, { method = 'GET', user, body, token } = {}) {
    const headers = {};
    if (body !== undefined) headers['content-type'] = 'application/json';
    const bearer = token ?? (user ? tokenService.signAccessToken(user) : null);
    if (bearer) headers.authorization = `Bearer ${bearer}`;
    const response = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
  }

  async function close() {
    server.close();
    for (const [model, , methods] of targets) {
      for (const method of methods) delete model[method];
    }
  }

  return { userModel, projectModel, teamModel, addUser, request, close };
}
