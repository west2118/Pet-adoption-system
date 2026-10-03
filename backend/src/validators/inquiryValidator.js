import { z } from 'zod';

export const createInquirySchema = z.object({
  petId: z.string().uuid('Invalid pet ID format'),
  fromName: z.string().min(1, 'Name is required').max(255),
  fromEmail: z.string().email('Invalid email format'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});
