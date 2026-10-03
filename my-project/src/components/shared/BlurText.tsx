import { useEffect, useRef, useState } from 'react';
import type { ElementType } from 'react';
import { cn } from '@/lib/utils';

interface BlurTextProps {
  children: string;
  className?: string;
  /** Delay before the first word starts revealing, in milliseconds. */
  delay?: number;
  as?: ElementType;
}

const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Reveals a sentence one word at a time, each word fading out of a blur as it
 * enters the viewport. Purely decorative motion, so it is skipped entirely when
 * `prefers-reduced-motion` is set and the text is rendered plainly.
 */
export const BlurText = ({ children, className, delay: delayMs = 0, as: Tag = 'p' }: BlurTextProps) => {
  const ref = useRef<HTMLElement>(null);
  const words = children.split(' ');

  const [shown, setShown] = useState(
    () => typeof IntersectionObserver === 'undefined' || prefersReducedMotion(),
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.01, rootMargin: '0px 0px -10% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={cn('flex flex-wrap justify-center', className)}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="inline-block transition-all duration-700 ease-out motion-reduce:transition-none"
          style={{
            marginRight: '0.3em',
            opacity: shown ? 1 : 0,
            filter: shown ? 'blur(0px)' : 'blur(40px)',
            transitionDelay: shown ? `${delayMs + index * 60}ms` : undefined,
          }}
        >
          {word}
        </span>
      ))}
    </Tag>
  );
};
