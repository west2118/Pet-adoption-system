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
  status: z.enum(['Submitted', 'Under Review', 'Approved', 'Rejected', 'Adopted']),
  note: z.string().max(2000).optional().nullable(),
});
