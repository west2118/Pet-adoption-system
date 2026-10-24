import { z } from 'zod';

export const createVisitSchema = z.object({
  petId: z.string().uuid('Invalid pet ID format'),
  preferredSlot: z.string().min(1, 'Preferred date/time is required').max(255),
});

export const visitPetParam = z.object({
  petId: z.string().uuid('Invalid pet ID format'),
});

export const updateVisitStatusSchema = z.object({
  status: z.enum(['confirmed', 'completed', 'cancelled']),
  confirmedSlot: z.string().max(255).optional(),
  cancelReason: z.string().max(500).optional(),
});

export const cancelVisitSchema = z.object({
  cancelReason: z.string().max(500).optional(),
});
