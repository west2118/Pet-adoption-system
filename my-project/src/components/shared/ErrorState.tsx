import { RefreshCw, TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  /** Short headline, e.g. "Could not load listings". */
  title?: string;
  /** One or two sentences explaining what failed and what to do next. */
  description?: string;
  /** Shows a "Try again" button when the caller can refetch. */
  onRetry?: () => void;
  className?: string;
}

/**
 * Shared failure panel for data-driven pages. Pages use this instead of
 * rendering demo/mock content when a request fails, so the visitor always
 * sees what went wrong and — where possible — a way to retry.
 */
export const ErrorState = ({
  title = 'Could not load this page',
  description = 'The server did not respond. Check your connection and try again.',
  onRetry,
  className,
}: ErrorStateProps) => {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-6" />
      </span>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="size-3.5" />
          Try again
        </Button>
      ) : null}
    </div>
  );
};
