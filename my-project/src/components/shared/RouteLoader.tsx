import { useEffect, useRef, useState } from 'react';
import { PawPrint } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** Portals opt out — the loader is a public-site flourish, not an app-wide gate. */
const PORTAL_PREFIXES = ['/shelter', '/admin', '/dashboard'];

const isPublicPath = (pathname: string) =>
  !PORTAL_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

/** Minimum time on screen, so the animation reads as intentional rather than a flicker. */
const MIN_VISIBLE_MS = 900;

/** Time from the start of the fade-out to unmounting the overlay. */
const FADE_OUT_MS = 600;

const WORDMARK = ['P', 'a', 'w', 's', '&', 'H', 'o', 'm', 'e', 's'];

/**
 * Full-screen loader shown while navigating between public routes.
 *
 * The first render is skipped on purpose: the pre-React splash in `index.html` is
 * already covering a cold load, so animating in here too would double up.
 *
 * The overlay always unmounts on a timer, so a slow or failing route can never leave the
 * user staring at a spinner with no way out.
 */
export const RouteLoader = () => {
  const { pathname } = useLocation();

  const [trackedPath, setTrackedPath] = useState(pathname);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /*
   * Adjusted during render rather than in an effect: a path change is new information
   * available at render time, so reacting to it here avoids a wasted render pass and the
   * cascading-render lint that a `setState`-in-effect would trigger. React discards the
   * in-progress render and immediately re-runs with the corrected state.
   */
  if (pathname !== trackedPath) {
    setTrackedPath(pathname);
    setVisible(isPublicPath(pathname));
    setLeaving(false);
  }

  useEffect(() => {
    if (!visible) return;

    leaveTimer.current = setTimeout(() => setLeaving(true), MIN_VISIBLE_MS);
    unmountTimer.current = setTimeout(() => setVisible(false), MIN_VISIBLE_MS + FADE_OUT_MS);

    return () => {
      clearTimeout(leaveTimer.current);
      clearTimeout(unmountTimer.current);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className={cn(
        'landing-theme fixed inset-0 z-[60] flex flex-col items-center justify-center gap-7 overflow-hidden bg-background transition-opacity duration-500',
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
    >
      {/* Same warm orbs and hairline grid as the public heroes. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 grid grid-cols-6 opacity-[0.06]">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className="border-r border-foreground" />
          ))}
        </div>
        <div className="absolute -right-24 top-1/4 size-[34rem] rounded-full bg-[var(--brand)]/15 blur-[120px]" />
        <div className="absolute -left-24 bottom-0 size-[26rem] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="relative flex flex-col items-center gap-7">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-[var(--brand)] text-white shadow-[0_12px_32px_rgba(233,122,44,0.35)] motion-safe:animate-boot-pulse">
          <PawPrint className="size-7" />
        </span>

        <span className="flex font-display text-[2rem] tracking-tight">
          {WORDMARK.map((char, i) => (
            <span
              key={`${char}-${i}`}
              className="inline-block motion-safe:animate-boot-rise motion-reduce:opacity-100"
              style={{ opacity: 0, animationDelay: `${i * 55}ms` }}
            >
              {char}
            </span>
          ))}
        </span>

        <span className="relative h-0.5 w-44 overflow-hidden rounded-full bg-foreground/10">
          <span className="absolute inset-0 origin-left rounded-full bg-[var(--brand)] motion-safe:animate-boot-fill" />
        </span>

        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          Finding a forever friend
        </p>
      </div>
    </div>
  );
};
