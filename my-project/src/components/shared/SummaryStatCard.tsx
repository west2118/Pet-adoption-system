import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface SummaryStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  className?: string;
}

export const SummaryStatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  className,
}: SummaryStatCardProps) => {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="pt-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
            <Icon className="size-4.5" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
        </div>
        <p className="mt-3 text-3xl font-extrabold tracking-tight">{value}</p>
        {subtitle ? (
          <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </CardContent>
    </Card>
  );
};
