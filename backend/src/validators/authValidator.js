import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  role: z.enum(['adopter', 'shelter_staff', 'platform_admin']).default('adopter'),
  shelterId: z.string().uuid('Invalid shelter ID format').optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  clientLocation: z.string().max(255).optional(),
});

export const verifyOtpSchema = z.object({
  challengeId: z.string().uuid('Invalid challenge ID'),
  code: z.string().regex(/^\d{6}$/, 'Verification code must be 6 digits'),
});

export const resendOtpSchema = z.object({
  challengeId: z.string().uuid('Invalid challenge ID'),
});

export const verifySignupOtpSchema = z.object({
  verificationId: z.string().uuid('Invalid verification ID'),
  code: z.string().regex(/^\d{6}$/, 'Verification code must be 6 digits'),
});

export const resendSignupOtpSchema = z.object({
  verificationId: z.string().uuid('Invalid verification ID'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const verifyResetCodeSchema = z.object({
  resetId: z.string().uuid('Invalid reset ID'),
  code: z.string().regex(/^\d{6}$/, 'Verification code must be 6 digits'),
});

export const resetPasswordSchema = z.object({
  resetId: z.string().uuid('Invalid reset ID'),
  code: z.string().regex(/^\d{6}$/, 'Verification code must be 6 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255).optional(),
  avatarUrl: z.string().trim().max(2048).optional().nullable(),
});
