import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const fieldBase =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50';

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => {
  return <input className={cn(fieldBase, 'h-9', className)} {...props} />;
};

export const Textarea = ({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  return <textarea className={cn(fieldBase, 'min-h-24 py-2', className)} {...props} />;
};

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

export const Select = ({ options, className, ...props }: SelectProps) => {
  return (
    <select className={cn(fieldBase, 'h-9', className)} {...props}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
};

export const Label = ({
  children,
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('mb-1.5 block text-sm font-medium', className)}
    >
      {children}
    </label>
  );
};
