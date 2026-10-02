import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const sizeClasses = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
} as const;

interface DetailsModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof sizeClasses;
}

/**
 * Card modal: centered dialog card for DETAILS / read-only views.
 * Overlay + card only — the trigger lives with the caller.
 */
export const DetailsModal = ({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  children,
  footer,
  size = 'md',
}: DetailsModalProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0 animate-in bg-black/40 fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className={cn(
              'flex max-h-[85vh] w-full animate-in flex-col overflow-hidden rounded-xl border bg-card shadow-xl fade-in zoom-in-95 duration-200',
              sizeClasses[size],
            )}
          >
            <div className="flex shrink-0 items-center gap-3 border-b p-5 pb-4">
              {Icon ? (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                  <Icon className="size-4.5" />
                </span>
              ) : null}
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold">{title}</h2>
                {description ? (
                  <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>

            {footer ? <div className="shrink-0 border-t p-4">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
};
