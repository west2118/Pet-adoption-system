/**
 * Shared bridge between zod and the project's per-field form errors
 * (`ValidatedInput` / `ValidatedSelect` / `ValidatedTextarea`).
 *
 * Every form in the app shows a single message under each field, so these
 * helpers keep the error state a flat `{ field: message }` map instead of
 * leaking zod's issue tree into components.
 */

/** The only part of a zod issue a form error needs. */
export interface FieldIssue {
  path: PropertyKey[];
  message: string;
}

/** Error map keyed by form field, ready for component state. */
export type FieldErrors<Field extends string> = Partial<Record<Field, string>>;

/**
 * Collapses zod issues into one message per field — the first issue wins,
 * which matches the order of the rules in the schema.
 *
 * @example
 * const parsed = loginSchema.safeParse(values);
 * if (!parsed.success) setErrors(toFieldErrors<keyof LoginValues>(parsed.error.issues));
 */
export const toFieldErrors = <Field extends string = string>(
  issues: readonly FieldIssue[],
): FieldErrors<Field> =>
  issues.reduce<FieldErrors<Field>>((errors, issue) => {
    const field = issue.path[0] as Field | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
    return errors;
  }, {});
