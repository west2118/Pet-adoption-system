import { Skeleton } from '@/components/ui/Skeleton';
import { TableCell, TableRow } from '@/components/ui/Table';
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

interface TableSkeletonRowsProps {
  /** Number of placeholder rows to show (roughly the page size). */
  rows?: number;
  /** Number of columns in the table header. */
  columns?: number;
  /** First column holds an image + two text lines (avatar-style cell). */
  avatar?: boolean;
  className?: string;
}

/**
 * Placeholder rows rendered INSIDE a <TableBody> while data loads or refreshes,
 * so the table itself (headers included) stays on screen instead of being
 * replaced by a "Loading…" note outside the table.
 */
export const TableSkeletonRows = ({
  rows = 5,
  columns = 4,
  avatar = false,
  className,
}: TableSkeletonRowsProps) => {
  const widths = ['w-5/6', 'w-2/3', 'w-3/4', 'w-1/2', 'w-2/3', 'w-3/5'];

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow
          key={`skeleton-row-${rowIndex}`}
          className={cn('hover:bg-transparent', className)}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <TableCell key={`skeleton-cell-${colIndex}`}>
              {avatar && colIndex === 0 ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 shrink-0 rounded-lg" />
                  <div className="min-w-0 space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ) : (
                <Skeleton
                  className={cn('h-3.5', widths[(rowIndex + colIndex) % widths.length])}
                />
              )}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};

interface RecordCardSkeletonProps {
  /** Number of placeholder cards (the small-screen stacked list). */
  count?: number;
  /** Extra classes applied to every placeholder card. */
  className?: string;
}

/**
 * Mobile stacked-card counterpart to TableSkeletonRows. Renders bare cards so
 * it drops straight into an existing card list container.
 */
export const RecordCardSkeleton = ({ count = 3, className }: RecordCardSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn('rounded-xl border bg-card p-4', className)}>
          <div className="flex items-start gap-3">
            <Skeleton className="size-12 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Skeleton className="size-7 rounded-md" />
              <Skeleton className="size-7 rounded-md" />
            </div>
          </div>
          <Skeleton className="mt-3 h-3 w-2/3" />
        </div>
      ))}
    </>
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
