import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  role: z.enum(['adopter', 'shelter_staff', 'platform_admin']),
  shelterId: z.string().uuid('Invalid shelter ID format').optional().nullable(),
});

export const favoriteParamsSchema = z.object({
  petId: z.string().uuid('Invalid pet ID format'),
});
