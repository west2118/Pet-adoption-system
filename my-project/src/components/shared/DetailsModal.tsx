import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useScrollLock } from '@/hooks/useScrollLock';
import { cn } from '@/lib/utils';

const sizeClasses = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
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
  const overlayRef = useRef<HTMLDivElement>(null);

  useScrollLock(open, overlayRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={overlayRef}
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <div className="absolute inset-0 overflow-hidden">
            <div className="flex h-full items-center justify-center p-4">
              <motion.div
                className={cn(
                  'flex max-h-[85vh] w-full flex-col overflow-hidden rounded-xl border bg-card shadow-xl',
                  sizeClasses[size],
                )}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
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

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">{children}</div>

                {footer ? <div className="shrink-0 border-t p-4">{footer}</div> : null}
              </motion.div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
