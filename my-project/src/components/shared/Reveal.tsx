import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger in milliseconds, applied as a transition delay. */
  delay?: number;
  as?: ElementType;
  style?: CSSProperties;
}

/**
 * Fades + lifts its children into view once, the first time they enter the viewport.
 *
 * Purely presentational and SSR-safe: before the observer attaches the content is
 * visible, so a failed observer can never hide the page permanently.
 */
export const Reveal = ({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
  style,
}: RevealProps) => {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    // The start state sits 32px low (`translate-y-8`), so a bottom-of-viewport element
    // can dip below a higher ratio threshold and never trigger. A near-zero threshold
    // plus a small bottom margin keeps the reveal reliable without firing off-screen.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.01, rootMargin: '0px 0px -24px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={{ ...style, transitionDelay: shown && delay ? `${delay}ms` : undefined }}
      className={cn(
        'transition-all duration-1000 ease-out motion-reduce:transition-none',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
        className,
      )}
    >
      {children}
    </Tag>
  );
};