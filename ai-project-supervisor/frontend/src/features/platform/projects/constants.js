export const STAGES = Object.freeze([
  { key: 'Idea Discovery', path: null },
  { key: 'Analysis and Planning', path: null },
  { key: 'Execution', path: null },
  { key: 'Completion Review', path: null },
  { key: 'Completed', path: null }
]);

export const STAGE_KEYS = Object.freeze(STAGES.map((stage) => stage.key));

export const MODE_LABELS = Object.freeze({
  individual: 'Individual',
  team: 'Team'
});

export const PROJECT_ROLE_LABELS = Object.freeze({
  team_leader: 'Team Leader',
  team_member: 'Team Member'
});

export const RELATION_LABELS = Object.freeze({
  supervisor: 'Assigned supervisor',
  inspector: 'Read-only inspection'
});

export function accessLabel(access) {
  if (!access) return '';
  return PROJECT_ROLE_LABELS[access.projectRole] ?? RELATION_LABELS[access.relation] ?? '';
}
