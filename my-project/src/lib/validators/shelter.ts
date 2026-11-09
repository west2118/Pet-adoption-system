import { z } from 'zod';

/**
 * Validation rules for the shelter portal forms.
 *
 * Keeping the rules here (rather than inside each page) means the schema, its
 * messages and the inferred value types stay together and can be reused.
 * Pages validate with `safeParse` + `toFieldErrors`, matching the pet listing
 * form, so every field shows the same red error treatment.
 */

const requiredText = (message: string) => z.string().trim().min(1, message);

/** Shelter profile / identity form. */
export const shelterProfileSchema = z.object({
  name: requiredText('Please enter the shelter name.'),
  location: requiredText('Please enter the city / location.'),
  address: requiredText('Please enter the street address.'),
  email: z
    .string()
    .trim()
    .pipe(z.email('Enter a valid contact email.')),
  phone: requiredText('Please enter a phone number.'),
  operatingHours: requiredText('Please enter operating hours.'),
  description: requiredText('Please describe the shelter.'),
  adoptionPolicy: z.string(),
  logoUrl: z.string(),
});

export type ShelterProfileValues = z.infer<typeof shelterProfileSchema>;

/** Create / edit waiver template form. */
export const waiverTemplateFormSchema = z.object({
  name: requiredText('Please enter the template name.'),
  category: requiredText('Please select a category.'),
  body: z
    .string()
    .trim()
    .min(1, 'Please enter the waiver text.')
    .min(10, 'Waiver text must be at least 10 characters.'),
});

export type WaiverTemplateValues = z.infer<typeof waiverTemplateFormSchema>;

/** Shared rules for adding and editing a shelter team account. */
const shelterUserBaseSchema = z.object({
  name: requiredText('Please enter the full name.'),
  email: z
    .string()
    .trim()
    .pipe(z.email('Enter a valid email address.')),
  accountType: z.enum(['staff', 'admin']),
  password: z.string(),
});

/** New accounts need a password of at least 8 characters. */
export const shelterUserCreateSchema = shelterUserBaseSchema.superRefine(
  ({ password }, ctx) => {
    if (password.length < 8) {
      ctx.addIssue({
        code: 'custom',
        path: ['password'],
        message: 'Password must be at least 8 characters.',
      });
    }
  },
);

/** Edits keep the current password when the field is left blank. */
export const shelterUserUpdateSchema = shelterUserBaseSchema.superRefine(
  ({ password }, ctx) => {
    if (password.length > 0 && password.length < 8) {
      ctx.addIssue({
        code: 'custom',
        path: ['password'],
        message: 'Password must be at least 8 characters.',
      });
    }
  },
);

export type ShelterUserValues = z.infer<typeof shelterUserBaseSchema>;

/** Inquiry reply composer. */
export const inquiryReplySchema = z.object({
  subject: requiredText('Add a subject before sending.').max(
    200,
    'Subject must be 200 characters or fewer.',
  ),
  message: requiredText('Add a message before sending.').max(
    5000,
    'Message must be 5000 characters or fewer.',
  ),
});

export type InquiryReplyValues = z.infer<typeof inquiryReplySchema>;

/** Visit confirmation email (date + optional message). */
export const visitEmailSchema = z.object({
  slot: requiredText('Add the visit date and time before sending.').max(
    255,
    'Visit date and time must be 255 characters or fewer.',
  ),
  message: z
    .string()
    .trim()
    .max(1000, 'Message must be 1000 characters or fewer.'),
});

export type VisitEmailValues = z.infer<typeof visitEmailSchema>;

/** Decline / cancel visit reason. */
export const visitDeclineSchema = z.object({
  reason: z.string().trim().max(500, 'Reason must be 500 characters or fewer.'),
});

export type VisitDeclineValues = z.infer<typeof visitDeclineSchema>;

/** Application decision — pickup details are required only for approvals. */
export const applicationDecisionSchema = z
  .object({
    action: z.enum(['Approved', 'Adopted', 'Return', 'Rejected', 'Cancelled']),
    note: z.string().trim().max(2000, 'Note must be 2000 characters or fewer.'),
    pickupAt: z.string().trim(),
    pickupEmail: z.string().trim(),
  })
  .superRefine(({ action, pickupAt, pickupEmail }, ctx) => {
    if (action !== 'Approved') return;

    if (!pickupAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['pickupAt'],
        message: 'Choose the date and time the adopter can pick up the pet.',
      });
    } else {
      const when = new Date(pickupAt);
      if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
        ctx.addIssue({
          code: 'custom',
          path: ['pickupAt'],
          message: 'The pickup date and time must be in the future.',
        });
      }
    }

    if (!pickupEmail) {
      ctx.addIssue({
        code: 'custom',
        path: ['pickupEmail'],
        message: 'Enter the email the adopter should contact about the pickup.',
      });
    } else if (!z.email().safeParse(pickupEmail).success) {
      ctx.addIssue({
        code: 'custom',
        path: ['pickupEmail'],
        message: 'Enter a valid pickup email.',
      });
    }
  });

export type ApplicationDecisionValues = z.infer<typeof applicationDecisionSchema>;
