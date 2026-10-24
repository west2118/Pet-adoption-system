import { z } from 'zod';

export const createApplicationSchema = z.object({
  petId: z.string().uuid('Invalid pet ID format'),
  applicantName: z.string().min(1, 'Applicant name is required').max(255),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone is required').max(50),
  address: z.string().min(1, 'Address is required'),
  housingType: z.enum(['house', 'apartment', 'condo', 'other']),
  hasOtherPets: z.boolean().default(false),
  experience: z.string().min(1, 'Experience is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export const updateApplicationStatusSchema = z.object({
  // `Cancelled` is the shelter's "Cancel adoption" action, only valid from
  // an Approved application (enforced in the service).
  status: z.enum(['Submitted', 'Under Review', 'Approved', 'Rejected', 'Cancelled', 'Adopted']),
  note: z.string().max(2000).optional().nullable(),
});

export const cancelApplicationSchema = z.object({
  reason: z.string().max(1000).optional(),
});
