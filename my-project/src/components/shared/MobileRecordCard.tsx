import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface MobileRecordCardProps {
  /** Photo or icon tile shown on the left. */
  media?: ReactNode;
  title: ReactNode;
  subtitle?: string;
  /** Badge pinned to the top-right corner. */
  status?: ReactNode;
  /** Badges shown under the title. */
  badges?: ReactNode;
  /** Optional preview/body content. */
  children?: ReactNode;
  /** Short text shown at the start of the footer. */
  meta?: ReactNode;
  /** Icon-only actions shown at the end of the footer. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Small-screen record card used by the shelter tables. Mirrors the listings
 * mobile card: media on the left, status pinned top-right, badges underneath,
 * and record actions in a dedicated footer so they are easy to tap.
 */
export const MobileRecordCard = ({
  media,
  title,
  subtitle,
  status,
  badges,
  children,
  meta,
  actions,
  className,
}: MobileRecordCardProps) => (
  <article
    className={cn(
      'rounded-xl border bg-card p-3 shadow-xs transition-shadow focus-within:shadow-sm hover:shadow-sm',
      className,
    )}
  >
    <div className="flex items-start gap-3">
      {media}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">{title}</p>
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {status ? <div className="shrink-0">{status}</div> : null}
        </div>

        {badges ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">{badges}</div>
        ) : null}
      </div>
    </div>

    {children ? <div className="mt-3">{children}</div> : null}

    {meta || actions ? (
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
        <div className="min-w-0 text-xs text-muted-foreground">{meta}</div>

        {actions ? (
          <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
        ) : null}
      </div>
    ) : null}
  </article>
);
