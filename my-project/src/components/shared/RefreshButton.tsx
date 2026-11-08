import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { REFRESH_FEEDBACK_MS } from '@/hooks/useRefresh';
import { cn } from '@/lib/utils';

/** Minimum gap between refreshes, so the table cannot be refreshed repeatedly. */
export const REFRESH_COOLDOWN_MS = 5000;

interface RefreshButtonProps {
  /** Reloads the table. */
  onRefresh: () => void | Promise<void>;
  className?: string;
}

/**
 * Icon-only table refresh. The spin stays visible for a minimum window so
 * refreshes against a local API (which can finish in milliseconds) are still
 * perceptible, and the button then stays disabled for a five-second cooldown
 * before it accepts the next refresh.
 */
export const RefreshButton = ({ onRefresh, className }: RefreshButtonProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (cooldownUntil === null) return;

    const id = window.setInterval(() => {
      const remaining = cooldownUntil - Date.now();
      if (remaining <= 0) {
        setCooldownUntil(null);
        setSecondsLeft(0);
        return;
      }
      setSecondsLeft(Math.ceil(remaining / 1000));
    }, 200);

    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  const coolingDown = cooldownUntil !== null;

  const handleClick = async () => {
    if (refreshing || coolingDown) return;

    setRefreshing(true);
    setCooldownUntil(Date.now() + REFRESH_COOLDOWN_MS);
    setSecondsLeft(Math.ceil(REFRESH_COOLDOWN_MS / 1000));
    const startedAt = Date.now();

    try {
      await onRefresh();
    } catch {
      // The page renders its own error state; the spinner should still stop.
    } finally {
      const remaining = REFRESH_FEEDBACK_MS - (Date.now() - startedAt);
      if (remaining > 0) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, remaining);
        });
      }
      setRefreshing(false);
    }
  };

  let title = 'Refresh';
  if (refreshing) {
    title = 'Refreshing…';
  } else if (coolingDown) {
    title = `Refresh again in ${secondsLeft}s`;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      className={cn('text-muted-foreground', className)}
      aria-label="Refresh table"
      aria-busy={refreshing}
      title={title}
      onClick={() => void handleClick()}
      disabled={refreshing || coolingDown}
    >
      <RefreshCw className={cn('size-5', refreshing && 'animate-spin')} />
    </Button>
  );
};
