import { z } from 'zod';

export const createShelterApplicationSchema = z.object({
  name: z.string().min(1, 'Shelter name is required').max(255),
  location: z.string().min(1, 'Location is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required').max(50),
  email: z.string().email('Invalid email format'),
  operatingHours: z.string().min(1, 'Operating hours are required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  // Uploaded to Supabase Storage by the onboarding form; the application keeps
  // only the public URL.
  imageUrl: z
    .string()
    .refine(
      (v) => !v || /^https?:\/\/.+/i.test(v),
      'Photo must be an uploaded image URL',
    )
    .optional()
    .or(z.literal('')),
});

export const approveShelterApplicationSchema = z.object({
  message: z.string().max(1000).optional(),
});

export const reviewShelterApplicationSchema = z.object({
  reviewNote: z.string().max(1000).optional(),
});
