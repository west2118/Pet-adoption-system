import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Omit when the page size is fixed (e.g. the browse grid's backend limit of 10). */
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  /** Hide the page-size selector — the backend then owns the page size alone. */
  showPageSize?: boolean;
  label?: string;
}

export const TablePagination = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 30, 50],
  showPageSize = true,
  label = 'items',
}: TablePaginationProps) => {
  if (totalItems <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{startIndex + 1}</span>–
          <span className="font-medium text-foreground">{endIndex}</span> of{' '}
          <span className="font-medium text-foreground">{totalItems}</span> {label}
        </p>
        {showPageSize && (
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange?.(Number(e.target.value));
              onPageChange(1);
            }}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="size-4" /> Prev
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <Button
            key={n}
            variant={n === currentPage ? 'default' : 'outline'}
            size="icon-sm"
            aria-label={`Go to page ${n}`}
            aria-current={n === currentPage ? 'page' : undefined}
            onClick={() => onPageChange(n)}
          >
            {n}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
};
