import { z } from 'zod';
import {
  PASSWORD_MAX_LENGTH,
  fullNameSchema,
  newPasswordSchema
} from '../auth/auth.validators.js';

export const MAX_SKILLS = 50;
export const MAX_SKILL_LENGTH = 50;

const skillSchema = z
  .string({ required_error: 'Skill is required', invalid_type_error: 'Skill must be text' })
  .trim()
  .min(1, 'Skill cannot be empty')
  .max(MAX_SKILL_LENGTH, `A skill must be at most ${MAX_SKILL_LENGTH} characters`);

export const skillsSchema = z
  .array(skillSchema, { invalid_type_error: 'Skills must be a list' })
  .max(MAX_SKILLS, `A profile can hold at most ${MAX_SKILLS} skills`)
  .transform((skills) => {
    const seen = new Set();
    const unique = [];
    for (const skill of skills) {
      const key = skill.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(skill);
    }
    return unique;
  });

export const updateProfileSchema = z
  .object({
    fullName: fullNameSchema.optional(),
    profile: z.object({ skills: skillsSchema.optional() }).strict().optional()
  })
  .strict()
  .refine(
    (value) => value.fullName !== undefined || value.profile?.skills !== undefined,
    { message: 'Provide at least one field to update' }
  );

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'Current password is required' })
      .min(1, 'Current password is required')
      .max(PASSWORD_MAX_LENGTH, 'Current password is not valid'),
    newPassword: newPasswordSchema
  })
  .strict();
