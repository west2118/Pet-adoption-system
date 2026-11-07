import { z } from 'zod';
import { ageYearsFromBirthdate } from '@/helpers/petListingHelpers';

export const petListingFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Please enter the pet name.'),
    species: z.string().min(1, 'Please select species.'),
    breed: z.string().trim().min(1, 'Please enter the breed.'),
    birthdate: z
      .string()
      .trim()
      .min(1, 'Please select the birthdate.')
      .refine(
        (val) => {
          const years = ageYearsFromBirthdate(val);
          return years !== null;
        },
        { message: 'Please select a valid birthdate (not in the future).' },
      )
      .refine(
        (val) => {
          const years = ageYearsFromBirthdate(val);
          return years === null || years <= 30;
        },
        { message: 'Please check the birthdate — over 30 years old.' },
      ),
    size: z.enum(['small', 'medium', 'large']),
    gender: z.enum(['male', 'female']),
    shelterId: z.string().optional(),
    status: z.enum(['Available', 'In Process', 'Adopted', 'Fostered']),
    visibility: z.enum(['public', 'private']),
    description: z
      .string()
      .trim()
      .min(1, 'Please enter a description.')
      .min(10, 'Description must be at least 10 characters.'),
    temperament: z
      .array(z.string())
      .refine((arr) => arr.some((t) => t.trim().length > 0), {
        message: 'Please add at least one temperament trait.',
      }),
    photoUrls: z.string(),
    medicalHistory: z
      .array(z.string())
      .refine((arr) => arr.some((m) => m.trim().length > 0), {
        message: 'Please add at least one medical record.',
      }),
    behavioralNotes: z
      .array(z.string())
      .refine((arr) => arr.some((b) => b.trim().length > 0), {
        message: 'Please add at least one behavioral note.',
      }),
    vaccinated: z.boolean(),
    spayedNeutered: z.boolean(),
    goodWithKids: z.boolean(),
    goodWithPets: z.boolean(),
    microchipped: z.boolean(),
    dewormed: z.boolean(),
    houseTrained: z.boolean(),
    goodWithStrangers: z.boolean(),
    leashTrained: z.boolean(),
    crateTrained: z.boolean(),
    litterTrained: z.boolean(),
    apartmentFriendly: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const photos = data.photoUrls
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);
    if (photos.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['photos'],
        message: 'Please add at least one photo.',
      });
    }
  });

export type PetListingFormValues = z.infer<typeof petListingFormSchema>;

