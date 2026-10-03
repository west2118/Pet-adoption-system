import { cloneElement, isValidElement, useId } from 'react';
import type {
  InputHTMLAttributes,
  ReactElement,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';
import { Input, Label, Select, Textarea } from '@/components/ui/Form';

/**
 * Shared validation primitives for every form in the app.
 *
 * Usage:
 * ```tsx
 * import { ValidatedInput, ValidatedTextarea, focusFirstError, isEmail } from '@/components/shared';
 *
 * const [errors, setErrors] = useState<{ email?: string }>({});
 *
 * const handleSubmit = (e) => {
 *   e.preventDefault();
 *   const next: typeof errors = {};
 *   if (!isEmail(email)) next.email = 'Enter a valid email address.';
 *   setErrors(next);
 *   if (Object.keys(next).length > 0) {
 *     focusFirstError(); // scrolls to + focuses the first red field
 *     return;
 *   }
 *   // ...submit
 * };
 *
 * <form noValidate onSubmit={handleSubmit}>
 *   <ValidatedInput id="login-email" type="email" value={email} error={errors.email} ... />
 * </form>
 * ```
 *
 * - `errorInputClass` paints the red border + red focus ring.
 * - `ValidatedInput / ValidatedTextarea / ValidatedSelect` wrap the base
 *   `ui/Form` controls: they apply the error class, set `aria-invalid`,
 *   and render the message underneath — all in one component.
 * - `Field` is a label + control + error layout wrapper.
 * - `scrollToFirstError / focusFirstError` move scroll + focus to the first
 *   invalid field so users immediately see what to fix.
 */

// ---------------------------------------------------------------------------
// Error styling
// ---------------------------------------------------------------------------

/** Appended to a field's className when it has an error → red border. */
export const errorInputClass =
  'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40';

/** Small red message rendered under an invalid field. */
export const FieldError = ({ id, message }: { id: string; message: string }) => (
  <p id={id} role="alert" className="text-[13px] text-destructive">
    {message}
  </p>
);

// ---------------------------------------------------------------------------
// Scroll / focus helpers
// ---------------------------------------------------------------------------

/**
 * Scrolls to + focuses the first field marked `aria-invalid="true"`.
 * @returns true when an invalid field was found and focused.
 */
export const scrollToFirstError = (scope?: ParentNode | null): boolean => {
  const root: ParentNode = scope ?? document;
  const el = root.querySelector?.('[aria-invalid="true"]') as HTMLElement | null;
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  requestAnimationFrame(() => {
    try {
      el.focus({ preventScroll: true });
    } catch {
      el.focus();
    }
  });
  return true;
};

/**
 * Run after `setErrors(...)` — waits a frame so React has painted the
 * `aria-invalid` attributes, then scrolls to the first error.
 */
export const focusFirstError = (scope?: ParentNode | null): void => {
  requestAnimationFrame(() => scrollToFirstError(scope));
};

// ---------------------------------------------------------------------------
// Tiny validators shared by every form
// ---------------------------------------------------------------------------

export const isBlank = (value: string): boolean => value.trim().length === 0;

export const isEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isUrl = (value: string): boolean => {
  if (isBlank(value)) return true; // optional fields accept empty
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------------
// Reusable field components
// ---------------------------------------------------------------------------

interface ValidatedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string | null;
}

export const ValidatedInput = ({ error, className, id, ...props }: ValidatedInputProps) => {
  const errorId = id ? `${id}-error` : undefined;
  return (
    <>
      <Input
        id={id}
        {...props}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : props['aria-describedby']}
        className={cn(error && errorInputClass, className)}
      />
      {error && <FieldError id={errorId ?? 'field-error'} message={error} />}
    </>
  );
};

interface ValidatedTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | null;
}

export const ValidatedTextarea = ({ error, className, id, ...props }: ValidatedTextareaProps) => {
  const errorId = id ? `${id}-error` : undefined;
  return (
    <>
      <Textarea
        id={id}
        {...props}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : props['aria-describedby']}
        className={cn(error && errorInputClass, className)}
      />
      {error && <FieldError id={errorId ?? 'field-error'} message={error} />}
    </>
  );
};

interface ValidatedSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  error?: string | null;
}

export const ValidatedSelect = ({ error, className, id, ...props }: ValidatedSelectProps) => {
  const errorId = id ? `${id}-error` : undefined;
  return (
    <>
      <Select
        id={id}
        {...props}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : props['aria-describedby']}
        className={cn(error && errorInputClass, className)}
      />
      {error && <FieldError id={errorId ?? 'field-error'} message={error} />}
    </>
  );
};

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string | null;
  labelClassName?: string;
  children: ReactNode;
}

/**
 * Label + control + error layout. Injects the red border / `aria-invalid`
 * into a plain `Input / Textarea / Select` child so you don't have to
 * repeat the error plumbing. Prefers an already-validated child
 * (`ValidatedInput`, …) untouched — it already renders its own message.
 */
export const Field = ({ label, htmlFor, error, labelClassName, children }: FieldProps) => {
  const fallback = useId();
  const errorId = `${htmlFor}-error-${fallback}`;

  let control = children;
  if (isValidElement(children)) {
    const child = children as ReactElement<{ className?: string; 'aria-invalid'?: boolean }>;
    const alreadyValidated = child.props['aria-invalid'] !== undefined;
    control = alreadyValidated
      ? child
      : cloneElement(child, {
          'aria-invalid': Boolean(error),
          className: cn(child.props.className, error && errorInputClass),
        });
  }

  return (
    <div className="space-y-2">
      <Label className={labelClassName} htmlFor={htmlFor}>
        {label}
      </Label>
      {control}
      {error && <FieldError id={errorId} message={error} />}
    </div>
  );
};
