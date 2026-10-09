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
  status: z.enum(['Available', 'In Process', 'Adopted', 'Fostered']).default('Available'),
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

/**
 * Public catalogue query.
 *
 * `limit` defaults to 10 — the page size the browse page relies on. The
 * backend owns pagination: clients ask for a `page` and get back a `meta`
 * block (page/limit/total/totalPages), so no caller has to slice results.
 * `parsePagination` still clamps an explicit limit to 1..100.
 */
export const petQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional().default(''),
  species: z.string().optional().default(''),
  breed: z.string().optional().default(''),
  ageGroup: z.string().optional().default(''),
  size: z.string().optional().default(''),
  gender: z.string().optional().default(''),
  status: z.string().optional().default(''),
  shelterId: z.string().optional().default(''),
  // Browse-page facets that used to be filtered client-side.
  temperament: z.string().optional().default(''),
  location: z.string().optional().default(''),
  excludeAdopted: z.string().optional().default('false'),
});
