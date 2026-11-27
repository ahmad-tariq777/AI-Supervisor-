import { z } from 'zod';
import { PROJECT_MODE_VALUES, PROJECT_STAGE_VALUES } from '../../shared/constants/statuses.js';

export const TITLE_MIN_LENGTH = 3;
export const TITLE_MAX_LENGTH = 150;
export const DESCRIPTION_MAX_LENGTH = 2000;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2})?)?$/;

function isRealCalendarDate(value) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  return (
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day
  );
}

const deadlineSchema = z
  .string({ invalid_type_error: 'Deadline must be a date' })
  .trim()
  .regex(DATE_PATTERN, 'Deadline must be an ISO date such as 2026-12-31')
  .refine(isRealCalendarDate, 'Deadline is not a valid date')
  .transform((value) => new Date(value))
  .refine((date) => !Number.isNaN(date.getTime()), 'Deadline is not a valid date')
  .refine((date) => date.getTime() > Date.now(), 'Deadline must be in the future');

export const createProjectSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(TITLE_MIN_LENGTH, `Title must be at least ${TITLE_MIN_LENGTH} characters`)
      .max(TITLE_MAX_LENGTH, `Title must be at most ${TITLE_MAX_LENGTH} characters`),
    description: z
      .string({ invalid_type_error: 'Description must be text' })
      .trim()
      .max(DESCRIPTION_MAX_LENGTH, `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`)
      .optional(),
    mode: z.enum(PROJECT_MODE_VALUES, {
      errorMap: (issue, ctx) => ({
        message:
          ctx.data === undefined
            ? 'Mode is required'
            : `Mode must be one of: ${PROJECT_MODE_VALUES.join(', ')}`
      })
    }),
    deadline: deadlineSchema.nullable().optional()
  })
  .strict();

export const listProjectsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1, 'Limit must be at least 1')
      .max(100, 'Limit must be at most 100')
      .default(20),
    stage: z.enum(PROJECT_STAGE_VALUES).optional(),
    mode: z.enum(PROJECT_MODE_VALUES).optional()
  })
  .strict();
