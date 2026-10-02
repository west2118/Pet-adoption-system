import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-sm',
        className,
      )}
      {...props}
    />
  );
};

export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn('p-5 pb-3', className)} {...props} />;
};

export const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h3 className={cn('text-lg font-semibold leading-tight', className)} {...props} />
  );
};

export const CardDescription = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p className={cn('mt-1 text-sm text-muted-foreground', className)} {...props} />
  );
};

export const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn('p-5 pt-0', className)} {...props} />;
};

export const CardFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('flex items-center gap-2 p-5 pt-0', className)} {...props} />
  );
};
