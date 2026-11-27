import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const emailSchema = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .max(254, 'Email is too long')
  .email('Enter a valid email address');

export const newPasswordSchema = z
  .string({ required_error: 'Password is required' })
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const fullNameSchema = z
  .string({ required_error: 'Full name is required' })
  .trim()
  .min(2, 'Full name must be at least 2 characters')
  .max(100, 'Full name must be at most 100 characters');

const refreshTokenSchema = z
  .string({ required_error: 'Refresh token is required' })
  .min(1, 'Refresh token is required')
  .max(4096, 'Refresh token is not valid');

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: newPasswordSchema
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required')
      .max(PASSWORD_MAX_LENGTH, 'Password is not valid')
  })
  .strict();

export const refreshSchema = z.object({ refreshToken: refreshTokenSchema }).strict();

export const logoutSchema = z.object({ refreshToken: refreshTokenSchema }).strict();
