export const TASK_STATUS = Object.freeze({
  TO_DO: 'To Do',
  IN_PROGRESS: 'In Progress',
  UNDER_REVIEW: 'Under Review',
  COMPLETED: 'Completed',
  BLOCKED: 'Blocked'
});

export const TASK_STATUS_VALUES = Object.freeze(Object.values(TASK_STATUS));

export const TASK_TRANSITIONS = Object.freeze({
  [TASK_STATUS.TO_DO]: Object.freeze([TASK_STATUS.IN_PROGRESS]),
  [TASK_STATUS.IN_PROGRESS]: Object.freeze([TASK_STATUS.BLOCKED, TASK_STATUS.UNDER_REVIEW]),
  [TASK_STATUS.BLOCKED]: Object.freeze([TASK_STATUS.IN_PROGRESS]),
  [TASK_STATUS.UNDER_REVIEW]: Object.freeze([TASK_STATUS.COMPLETED, TASK_STATUS.IN_PROGRESS]),
  [TASK_STATUS.COMPLETED]: Object.freeze([TASK_STATUS.IN_PROGRESS])
});

export const canTransitionTask = (from, to) =>
  (TASK_TRANSITIONS[from] ?? []).includes(to);

export const TASK_PRIORITY = Object.freeze({
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
});

export const TASK_PRIORITY_VALUES = Object.freeze(Object.values(TASK_PRIORITY));

export const VERIFICATION_STATUS = Object.freeze({
  PENDING_VERIFICATION: 'Pending Verification',
  VERIFIED: 'Verified',
  PARTIALLY_VERIFIED: 'Partially Verified',
  REJECTED: 'Rejected',
  REQUIRES_RESUBMISSION: 'Requires Resubmission'
});

export const VERIFICATION_STATUS_VALUES = Object.freeze(Object.values(VERIFICATION_STATUS));

export const PROJECT_STAGE = Object.freeze({
  IDEA_DISCOVERY: 'Idea Discovery',
  ANALYSIS_AND_PLANNING: 'Analysis and Planning',
  EXECUTION: 'Execution',
  COMPLETION_REVIEW: 'Completion Review',
  COMPLETED: 'Completed'
});

export const PROJECT_STAGE_VALUES = Object.freeze(Object.values(PROJECT_STAGE));

export const INVITATION_STATUS = Object.freeze({
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected'
});

export const INVITATION_STATUS_VALUES = Object.freeze(Object.values(INVITATION_STATUS));

export const REQUIREMENTS_STATUS = Object.freeze({
  DRAFT: 'Draft',
  APPROVED: 'Approved'
});

export const REQUIREMENTS_STATUS_VALUES = Object.freeze(Object.values(REQUIREMENTS_STATUS));

export const PROJECT_MODE = Object.freeze({
  INDIVIDUAL: 'individual',
  TEAM: 'team'
});

export const PROJECT_MODE_VALUES = Object.freeze(Object.values(PROJECT_MODE));

export const METHODOLOGY = Object.freeze({
  AGILE_SCRUM: 'Agile/Scrum',
  KANBAN: 'Kanban',
  WATERFALL: 'Waterfall'
});

export const METHODOLOGY_VALUES = Object.freeze(Object.values(METHODOLOGY));