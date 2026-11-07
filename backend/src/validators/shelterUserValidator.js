import { z } from 'zod';

export const createShelterUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  email: z.string().trim().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  accountType: z.enum(['admin', 'staff']).default('staff'),
});

export const updateShelterUserSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(255).optional(),
    email: z.string().trim().email('Invalid email format').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128).optional(),
    accountType: z.enum(['admin', 'staff']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update.',
  });
