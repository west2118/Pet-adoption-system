import { z } from 'zod';

/**
 * Sign-in form rules.
 *
 * Validation lives here — not in the page — so the rules, their messages and
 * the types the form relies on stay together and can be reused (or tested)
 * without importing a component.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email('Enter a valid email address.')),
  password: z.string().min(1, 'Please enter your password.'),
});

/** The validated values handed to the auth service (email is already trimmed). */
export type LoginValues = z.infer<typeof loginSchema>;

/**
 * Registration form rules.
 *
 * `confirm` is not sent to the API — it exists so the schema can carry the
 * cross-field match rule in one place.
 */
export const signupSchema = z
  .object({
    name: z.string().trim().min(1, 'Please enter your full name.'),
    email: z
      .string()
      .trim()
      .pipe(z.email('Enter a valid email address.')),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirm: z.string(),
  })
  .superRefine(({ password, confirm }, ctx) => {
    const message =
      confirm !== password
        ? 'Passwords do not match.'
        : confirm.trim() === ''
          ? 'Please confirm your password.'
          : null;
    if (message) ctx.addIssue({ code: 'custom', path: ['confirm'], message });
  });

/** The validated values handed to `signup()` (confirm is verification only). */
export type SignupValues = z.infer<typeof signupSchema>;
