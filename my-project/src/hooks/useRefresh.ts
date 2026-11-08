import { useCallback, useRef, useState } from 'react';

/** How long the refreshing state stays visible, even if the request is instant. */
export const REFRESH_FEEDBACK_MS = 700;

/**
 * Wraps a refetch function so the caller can render a visible loading state.
 *
 * Local API requests can finish in a few milliseconds, which makes a skeleton
 * or spinner flash by too quickly to notice. This keeps `isRefreshing` true for
 * a short minimum window so the refresh is always perceptible, while still
 * waiting for the real request to finish before it clears.
 */
export function useRefresh(
  onRefresh: () => Promise<unknown>,
  minimumMs = REFRESH_FEEDBACK_MS,
) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    const startedAt = Date.now();

    try {
      await refreshRef.current();
    } catch {
      // The page renders the query's error state; the spinner should still end.
    } finally {
      const remaining = minimumMs - (Date.now() - startedAt);
      if (remaining > 0) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, remaining);
        });
      }
      setIsRefreshing(false);
    }
  }, [minimumMs]);

  return { isRefreshing, refresh };
}
