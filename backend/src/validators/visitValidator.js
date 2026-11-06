import { z } from 'zod';

export const createVisitSchema = z.object({
  petId: z.string().uuid('Invalid pet ID format'),
  preferredSlot: z.string().min(1, 'Preferred date and time is required').max(255),
  reason: z.string().min(1, 'Reason for visit is required').max(1000, 'Reason must not exceed 1000 characters'),
});

export const visitPetParam = z.object({
  petId: z.string().uuid('Invalid pet ID format'),
});

export const updateVisitStatusSchema = z.object({
  status: z.enum(['confirmed', 'completed', 'cancelled']),
  confirmedSlot: z.string().max(255).optional(),
  cancelReason: z.string().max(500).optional(),
  /** Short note emailed with the confirmation (visit date + message). */
  message: z.string().max(1000).optional(),
});

export const cancelVisitSchema = z.object({
  cancelReason: z.string().max(500).optional(),
});
