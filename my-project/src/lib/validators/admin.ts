import { z } from 'zod';

const requiredText = (message: string) => z.string().trim().min(1, message);

/** Rules for adding or editing a shelter in the admin portal */
export const adminShelterSchema = z.object({
  name: requiredText('Please enter the shelter name.'),
  location: requiredText('Please enter the city / location.'),
  address: requiredText('Please enter the street address.'),
  email: z
    .string()
    .trim()
    .pipe(z.email('Enter a valid contact email.')),
  phone: requiredText('Please enter a phone number.'),
  operatingHours: requiredText('Please enter operating hours.'),
  description: z.string().trim(),
  imageUrl: z.string().trim(),
});

export type AdminShelterFormSchemaValues = z.infer<typeof adminShelterSchema>;

/** Rules for updating a user's role and shelter assignment */
export const adminUserRoleSchema = z
  .object({
    role: z.enum(['adopter', 'shelter_staff', 'platform_admin']),
    shelterId: z.string().trim(),
  })
  .superRefine(({ role, shelterId }, ctx) => {
    if (role === 'shelter_staff' && !shelterId) {
      ctx.addIssue({
        code: 'custom',
        path: ['shelterId'],
        message: 'Please select an assigned shelter for shelter staff.',
      });
    }
  });

export type AdminUserRoleSchemaValues = z.infer<typeof adminUserRoleSchema>;

/** Rules for approving or rejecting a shelter application */
export const shelterApplicationReviewSchema = z.object({
  message: z.string().trim().max(2000, 'Message must be 2000 characters or fewer.'),
});

export type ShelterApplicationReviewValues = z.infer<typeof shelterApplicationReviewSchema>;

