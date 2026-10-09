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
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255).optional(),
  avatarUrl: z.string().trim().max(2048).optional().nullable(),
});
