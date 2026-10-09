import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

interface SummaryStatCardSkeletonProps {
  className?: string;
}

export const SummaryStatCardSkeleton = ({ className }: SummaryStatCardSkeletonProps) => {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5 shadow-xs', className)}>
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="size-9 shrink-0 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-8 w-20" />
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  );
};

interface SummaryStatGridSkeletonProps {
  columns?: 2 | 3 | 4;
  count?: number;
  className?: string;
}

export const SummaryStatGridSkeleton = ({
  columns = 4,
  count,
  className,
}: SummaryStatGridSkeletonProps) => {
  const itemsCount = count ?? columns;
  const gridColsClass =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 3
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : 'sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={cn('grid grid-cols-1 gap-4', gridColsClass, className)}>
      {Array.from({ length: itemsCount }).map((_, i) => (
        <SummaryStatCardSkeleton key={i} />
      ))}
    </div>
  );
};

interface ChartCardSkeletonProps {
  className?: string;
  height?: string;
}

export const ChartCardSkeleton = ({ className, height = 'h-64' }: ChartCardSkeletonProps) => {
  return (
    <div className={cn('flex flex-col rounded-xl border border-border bg-card p-5 shadow-xs', className)}>
      <div className="flex items-start gap-3">
        <Skeleton className="size-9 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-1.5 h-3 w-60" />
        </div>
      </div>
      <div className={cn('mt-5 flex w-full flex-col justify-end gap-2 rounded-lg bg-muted/20 p-4', height)}>
        <div className="flex h-full items-end gap-3 px-2">
          <Skeleton className="h-[40%] flex-1" />
          <Skeleton className="h-[65%] flex-1" />
          <Skeleton className="h-[30%] flex-1" />
          <Skeleton className="h-[85%] flex-1" />
          <Skeleton className="h-[50%] flex-1" />
          <Skeleton className="h-[70%] flex-1" />
        </div>
        <div className="flex justify-between gap-2 pt-2 border-t border-border/40">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </div>
  );
};

interface TableCardSkeletonProps {
  rowsCount?: number;
  className?: string;
}

export const TableCardSkeleton = ({ rowsCount = 4, className }: TableCardSkeletonProps) => {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5 shadow-xs', className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div>
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-1.5 h-3 w-56" />
          </div>
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      <div className="mt-5 space-y-3">
        {Array.from({ length: rowsCount }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 border-b border-border/40 py-2.5 last:border-0"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1 h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-3.5 w-24 hidden md:block" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ShelterOverviewSkeleton = () => {
  return (
    <div className="w-full px-4 py-6 sm:px-6">
      {/* Section Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Summary stats */}
      <SummaryStatGridSkeleton columns={4} className="mt-6" />

      {/* Charts row 1 */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <ChartCardSkeleton className="lg:col-span-2" />
        <ChartCardSkeleton />
      </div>

      {/* Charts row 2 */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>

      {/* Tables */}
      <TableCardSkeleton rowsCount={4} className="mt-4" />
      <TableCardSkeleton rowsCount={4} className="mt-4" />
    </div>
  );
};
