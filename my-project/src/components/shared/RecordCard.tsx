import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RecordCardProps {
  imageUrl?: string;
  imageAlt?: string;
  title: string;
  subtitle?: string;
  /** Status / visibility badges shown under the subtitle. */
  badges?: ReactNode;
  /** Optional body content (e.g. a message preview) below the header. */
  children?: ReactNode;
  /** Icon-only action buttons shown at the top-right of the card. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Shared mobile record card used across the portal list pages (listings,
 * applications, inquiries) so the small-screen layout stays consistent.
 */
export const RecordCard = ({
  imageUrl,
  imageAlt,
  title,
  subtitle,
  badges,
  children,
  actions,
  className,
}: RecordCardProps) => {
  return (
    <div className={cn('rounded-xl border bg-card p-4', className)}>
      <div className="flex items-start gap-3">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt ?? ''}
            className="size-12 shrink-0 rounded-lg object-cover"
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{title}</p>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
          {badges ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{badges}</div>
          ) : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 items-center gap-1">{actions}</div>
        ) : null}
      </div>

      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
};
