import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
} as const;

interface SlideOverProps {
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
 * Slider modal: right-side slide-over panel for ADD and EDIT forms.
 * Overlay + panel only — the trigger button lives with the caller.
 */
export const SlideOver = ({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  children,
  footer,
  size = 'md',
}: SlideOverProps) => {
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
      <aside
        className={cn(
          'absolute inset-y-0 right-0 flex w-full animate-in flex-col border-l bg-card shadow-xl slide-in-from-right duration-200',
          sizeClasses[size],
        )}
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b bg-card p-5 pb-4">
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
            aria-label="Close panel"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>

        {footer ? (
          <div className="sticky bottom-0 z-10 shrink-0 border-t bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        ) : null}
      </aside>
    </div>
  );
};
