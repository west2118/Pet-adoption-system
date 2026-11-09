import { useMemo } from 'react';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import { motion } from 'framer-motion';

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
 * Backed by framer-motion's `whileInView`: the `once` viewport keeps it a single
 * reveal. Motion is always enabled so the experience is identical on every device.
 */
export const Reveal = ({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
  style,
}: RevealProps) => {
  // `motion.create` is memoised so a custom `as` never recreates the component
  // on every render (which would remount its subtree).
  const MotionTag = useMemo(() => {
    if (typeof Tag === 'string') {
      return motion[Tag as keyof typeof motion] as unknown as typeof motion.div;
    }
    return motion.create(Tag) as typeof motion.div;
  }, [Tag]);

  return (
    <MotionTag
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -24px 0px' }}
      transition={{
        duration: 1,
        delay: delay / 1000,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
      style={style}
    >
      {children}
    </MotionTag>
  );
};
