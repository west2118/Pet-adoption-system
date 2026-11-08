import { useMemo } from 'react';
import type { ElementType } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BlurTextProps {
  children: string;
  className?: string;
  /** Delay before the first word starts revealing, in milliseconds. */
  delay?: number;
  as?: ElementType;
}

const wordVariants: Variants = {
  hidden: { opacity: 0, filter: 'blur(40px)' },
  show: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: 'easeOut' },
  },
};

/**
 * Reveals a sentence one word at a time, each word fading out of a blur as it
 * enters the viewport. Always animated so the effect is identical on every device.
 */
export const BlurText = ({ children, className, delay: delayMs = 0, as: Tag = 'p' }: BlurTextProps) => {
  const words = children.split(' ');

  const MotionTag = useMemo(() => {
    if (typeof Tag === 'string') {
      return motion[Tag as keyof typeof motion] as unknown as typeof motion.p;
    }
    return motion.create(Tag) as typeof motion.p;
  }, [Tag]);

  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: {
        delayChildren: delayMs / 1000,
        staggerChildren: 0.06,
      },
    },
  };

  return (
    <MotionTag
      className={cn('flex flex-wrap justify-center', className)}
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
    >
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          variants={wordVariants}
          className="inline-block"
          style={{ marginRight: '0.3em' }}
        >
          {word}
        </motion.span>
      ))}
    </MotionTag>
  );
};
