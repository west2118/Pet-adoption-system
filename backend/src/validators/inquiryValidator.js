import { z } from 'zod';

export const createInquirySchema = z.object({
  petId: z.string().uuid('Invalid pet ID format'),
  fromName: z.string().min(1, 'Name is required').max(255),
  fromEmail: z.string().email('Invalid email format'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const sendInquiryEmailSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be 200 characters or fewer')
    .regex(/^[^\r\n]*$/, 'Subject must be a single line'),
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(5000, 'Message must be 5000 characters or fewer'),
});
