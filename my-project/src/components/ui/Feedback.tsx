import { HeartCrack, PawPrint, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: 'search' | 'paw' | 'empty';
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({ title, description, icon = 'paw', action, className }: EmptyStateProps) => {
  const Icon = icon === 'search' ? SearchX : icon === 'empty' ? HeartCrack : PawPrint;
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-14 text-center',
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </span>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
};

export const LoadingGrid = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border p-4">
          <div className="h-48 rounded-lg bg-muted" />
          <div className="mt-3 h-4 w-2/3 rounded bg-muted" />
          <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
};
