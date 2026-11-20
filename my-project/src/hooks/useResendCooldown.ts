import { useEffect, useState } from 'react';

/** Delay before another verification code may be requested, in seconds. */
export const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Counts down a resend cooldown for one-time codes. `start()` is called when a
 * code is sent (initial send or resend) and the button stays disabled until the
 * countdown reaches zero.
 */
export function useResendCooldown(seconds = RESEND_COOLDOWN_SECONDS) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  return {
    remaining,
    isCoolingDown: remaining > 0,
    start: () => setRemaining(seconds),
  };
}
