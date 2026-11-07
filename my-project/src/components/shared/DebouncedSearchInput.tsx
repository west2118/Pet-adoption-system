import { useEffect, useState, type InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/Form';
import { cn } from '@/lib/utils';

export interface DebouncedSearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  /** The controlled or initial search value from parent. */
  value?: string;
  /** Triggered only after the user stops typing for `delay` ms. */
  onDebouncedChange: (value: string) => void;
  /** Optional callback fired on every raw keystroke. */
  onImmediateChange?: (value: string) => void;
  /** Debounce delay in milliseconds (default: 300). */
  delay?: number;
  /** Optional extra classes applied to the outer wrapper container. */
  wrapperClassName?: string;
  /** Whether to show a clear button when input has text (default: true). */
  showClear?: boolean;
}

/**
 * Reusable debounced search input component.
 * Displays a search icon, handles live input smoothly, provides an optional clear button,
 * and calls `onDebouncedChange` only after the user pauses typing.
 */
export const DebouncedSearchInput = ({
  value: externalValue = '',
  onDebouncedChange,
  onImmediateChange,
  delay = 300,
  wrapperClassName,
  showClear = true,
  className,
  placeholder = 'Search...',
  ...inputProps
}: DebouncedSearchInputProps) => {
  const [internalValue, setInternalValue] = useState(externalValue);
  const [prevExternalValue, setPrevExternalValue] = useState(externalValue);
  const debouncedValue = useDebounce(internalValue, delay);

  // Sync internal state if parent alters value from outside without useEffect setState
  if (externalValue !== prevExternalValue) {
    setPrevExternalValue(externalValue);
    setInternalValue(externalValue);
  }

  // Notify parent once debounced value changes
  useEffect(() => {
    onDebouncedChange(debouncedValue);
  }, [debouncedValue, onDebouncedChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalValue(val);
    onImmediateChange?.(val);
  };

  const handleClear = () => {
    setInternalValue('');
    onImmediateChange?.('');
  };

  return (
    <div className={cn('relative w-full sm:w-[240px]', wrapperClassName)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn('h-9 w-full pl-8', showClear && internalValue ? 'pr-8' : '', className)}
        {...inputProps}
      />
      {showClear && internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-full"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
};