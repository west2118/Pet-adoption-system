import { z } from 'zod';

export const createPetSchema = z.object({
  name: z.string().min(1, 'Pet name is required').max(100),
  species: z.enum(['dog', 'cat', 'rabbit', 'bird', 'other']),
  breed: z.string().min(1, 'Breed is required'),
  ageYears: z.number().min(0, 'Age must be non-negative'),
  ageGroup: z.enum(['puppy-kitten', 'young', 'adult', 'senior']),
  size: z.enum(['small', 'medium', 'large']),
  gender: z.enum(['male', 'female']),
  temperament: z.array(z.string()).default([]),
  visibility: z.enum(['public', 'private']).default('public'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  medicalHistory: z.array(z.string()).default([]),
  behavioralNotes: z.string().default(''),
  status: z.enum(['Available', 'Pending Adoption', 'Adopted', 'Fostered']).default('Available'),
  // Staff can upload photos (base64 data URLs) or paste https links — the
  // public catalogue just renders whatever string is stored.
  imageUrl: z
    .string()
    .min(1, 'Photo is required')
    .refine(
      (v) => v.startsWith('data:image/') || /^https?:\/\/.+/.test(v),
      'Photo must be an image upload or an http(s) URL',
    ),
  gallery: z
    .array(
      z
        .string()
        .refine(
          (v) => v.startsWith('data:image/') || /^https?:\/\/.+/.test(v),
          'Gallery photos must be image uploads or http(s) URLs',
        ),
    )
    .default([]),
  vaccinated: z.boolean().default(false),
  spayedNeutered: z.boolean().default(false),
  goodWithKids: z.boolean().default(false),
  goodWithPets: z.boolean().default(false),
});

export const updatePetSchema = createPetSchema.partial();

export const petQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('12'),
  search: z.string().optional().default(''),
  species: z.string().optional().default(''),
  breed: z.string().optional().default(''),
  ageGroup: z.string().optional().default(''),
  size: z.string().optional().default(''),
  gender: z.string().optional().default(''),
  status: z.string().optional().default(''),
  shelterId: z.string().optional().default(''),
});
