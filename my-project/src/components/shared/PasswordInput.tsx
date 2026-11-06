import { useState } from 'react';
import type { InputHTMLAttributes, Ref } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Form';
import { errorInputClass, FieldError } from './ValidatedField';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: string | null;
  /** Lets react-hook-form's `register()` attach its ref through this wrapper. */
  ref?: Ref<HTMLInputElement>;
}

/**
 * Password field with a show/hide toggle — same error plumbing as
 * `ValidatedInput`, so it drops into any form that already uses it.
 *
 * ```tsx
 * <PasswordInput id="login-pass" error={errors.password?.message} {...register('password')} />
 * ```
 */
export const PasswordInput = ({
  error,
  className,
  id,
  ref,
  ...props
}: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);
  const errorId = id ? `${id}-error` : undefined;

  return (
    <>
      <div className="relative">
        <Input
          id={id}
          ref={ref}
          type={visible ? 'text' : 'password'}
          {...props}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : props['aria-describedby']}
          className={cn('pr-11', error && errorInputClass, className)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <FieldError id={errorId ?? 'field-error'} message={error} />}
    </>
  );
};
