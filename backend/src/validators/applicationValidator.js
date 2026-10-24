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

/**
 * ISO date-time string (what `Date#toISOString()` produces). Accepts any value
 * `Date.parse` understands so the client can send either an ISO instant or a
 * `datetime-local` wall-clock value.
 */
const dateTimeString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid pickup date/time');

export const updateApplicationStatusSchema = z
  .object({
    // `Cancelled` is the shelter's "Cancel adoption" action (Approved only) and
    // `Returned` reverses a completed handover (Adopted only) — both enforced in
    // the service.
    status: z.enum([
      'Submitted',
      'Under Review',
      'Approved',
      'Rejected',
      'Cancelled',
      'Adopted',
      'Returned',
    ]),
    note: z.string().max(2000).optional().nullable(),
    /** Clinic appointment the adopter collects the pet — mandatory on approval. */
    pickupAt: dateTimeString.optional().nullable(),
    /** Contact address the adopter writes to about the pickup. */
    pickupEmail: z.string().email('Invalid pickup email format').max(255).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.status !== 'Approved') return;
    if (!value.pickupAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pickupAt'],
        message: 'A pickup date and time is required when approving an application.',
      });
    }
    if (!value.pickupEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pickupEmail'],
        message: 'A pickup contact email is required when approving an application.',
      });
    }
  });

// Adopters may withdraw at any point before handover, including after approval.
export const cancelApplicationSchema = z.object({
  reason: z.string().max(1000).optional(),
});
