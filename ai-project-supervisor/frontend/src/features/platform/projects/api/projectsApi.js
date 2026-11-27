import { apiRequest } from '../../../../shared/api/apiClient.js';

export function listProjects({ page = 1, limit = 12, stage, mode } = {}, signal) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (stage) params.set('stage', stage);
  if (mode) params.set('mode', mode);
  return apiRequest(`/projects?${params.toString()}`, { signal });
}

export async function getProject(projectId, signal) {
  const data = await apiRequest(`/projects/${encodeURIComponent(projectId)}`, { signal });
  return data.project;
}

export async function createProject({ title, description, mode, deadline }) {
  const body = { title, mode };
  if (description) body.description = description;
  if (deadline) body.deadline = deadline;
  const data = await apiRequest('/projects', { method: 'POST', body });
  return data.project;
}
