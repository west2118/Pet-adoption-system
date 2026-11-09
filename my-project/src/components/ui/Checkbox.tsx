import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

/**
 * Native checkbox with a custom check indicator. The input stays the accessible
 * control (label, keyboard, aria props all pass through); the SVG is a
 * pointer-events-none sibling revealed through Tailwind's peer variants.
 */
export const Checkbox = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <span className="relative inline-flex size-4 shrink-0 items-center justify-center">
    <input
      type="checkbox"
      className={cn(
        'peer size-4 cursor-pointer appearance-none rounded-[4px] border border-border bg-background shadow-xs transition-colors',
        'hover:border-primary/60',
        'checked:border-primary checked:bg-primary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute size-3 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  </span>
);
