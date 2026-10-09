import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { cn } from '@/lib/utils';

interface TableCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Header-right slot (e.g. a primary action button). */
  action?: ReactNode;
  /** Full-width control row rendered below the title/description, above the table. */
  toolbar?: ReactNode;
  children?: ReactNode;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export const TableCard = ({
  title,
  description,
  icon: Icon,
  action,
  toolbar,
  children,
  isEmpty = false,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  footer,
  className,
  contentClassName,
}: TableCardProps) => {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b pb-4">
        <div className="flex flex-wrap items-center gap-3">
          {Icon ? (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
              <Icon className="size-4.5" />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {action}
        </div>
      </CardHeader>
      {toolbar ? <div className="border-b px-5 py-3">{toolbar}</div> : null}
      <CardContent className={cn(isEmpty ? 'p-5 sm:p-6' : contentClassName)}>
        {isEmpty ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          children
        )}
      </CardContent>
      {footer ? <div className="border-t px-5 py-3">{footer}</div> : null}
    </Card>
  );
};
