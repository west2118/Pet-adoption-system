import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const columnClasses = {
  2: 'xl:grid-cols-2',
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
  5: 'xl:grid-cols-5',
} as const;

interface SummaryStatGridProps {
  children: ReactNode;
  columns?: keyof typeof columnClasses;
  className?: string;
}

export const SummaryStatGrid = ({
  children,
  columns = 5,
  className,
}: SummaryStatGridProps) => {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', columnClasses[columns], className)}>
      {children}
    </div>
  );
};
