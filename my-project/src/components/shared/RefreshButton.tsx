import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RefreshButtonProps {
  /** Reloads the table. The cooldown starts when this resolves. */
  onRefresh: () => void | Promise<void>;
  /** Minimum time between refreshes, in milliseconds. */
  cooldownMs?: number;
  className?: string;
}

const DEFAULT_COOLDOWN_MS = 5000;

/**
 * Icon-only table refresh. Disabled while the request is in flight and for a
 * short cooldown afterwards, so a table cannot be spammed with refetches.
 */
export const RefreshButton = ({
  onRefresh,
  cooldownMs = DEFAULT_COOLDOWN_MS,
  className,
}: RefreshButtonProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const [coolingDown, setCoolingDown] = useState(false);

  useEffect(() => {
    if (!coolingDown) return;
    const timeout = window.setTimeout(() => setCoolingDown(false), cooldownMs);
    return () => window.clearTimeout(timeout);
  }, [coolingDown, cooldownMs]);

  const disabled = refreshing || coolingDown;

  const handleClick = async () => {
    if (disabled) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      setCoolingDown(true);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className={cn('text-muted-foreground', className)}
      aria-label="Refresh table"
      title={disabled ? 'Refresh available shortly' : 'Refresh'}
      onClick={() => void handleClick()}
      disabled={disabled}
    >
      <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
    </Button>
  );
};
