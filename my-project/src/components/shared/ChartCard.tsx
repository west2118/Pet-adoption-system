import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export const ChartCard = ({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  contentClassName,
}: ChartCardProps) => {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center gap-3">
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
      <CardContent className={cn('pt-5', contentClassName)}>{children}</CardContent>
    </Card>
  );
};
