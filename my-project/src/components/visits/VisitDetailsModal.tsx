import { CalendarClock } from 'lucide-react';
import type { ReactNode } from 'react';

import { DetailsModal } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { VisitStatusBadge } from '@/components/ui/StatusBadge';
import type { VisitThread } from '@/types';
import { formatDate } from '@/utils/formatters';

const DetailTerm = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
      {label}
    </dt>
    <dd className="mt-1">{children}</dd>
  </div>
);

export interface VisitDetailsModalProps {
  thread: VisitThread | null;
  onClose: () => void;
}

/** Read-only request view — decisions happen in the other visit dialogs. */
export const VisitDetailsModal = ({ thread, onClose }: VisitDetailsModalProps) => {
  const actionable = thread != null && ['requested', 'confirmed'].includes(thread.status);

  return (
    <DetailsModal
      open={thread !== null}
      onClose={onClose}
      title={thread?.pet?.name ? `Visit request · ${thread.pet.name}` : 'Visit request'}
      description={
        thread
          ? `Preferred ${thread.preferredSlot}${
              thread.confirmedSlot ? ` · confirmed ${thread.confirmedSlot}` : ''
            }`
          : undefined
      }
      icon={CalendarClock}
      size="xl"
      footer={
        thread ? (
          <Button size="sm" variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        ) : undefined
      }
    >
      {thread ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <VisitStatusBadge status={thread.status} />
            <span className="text-sm text-muted-foreground">
              Requested {formatDate(thread.createdAt)}
            </span>
          </div>

          <dl className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
            <DetailTerm label="Adopter">{thread.adopter?.name ?? '—'}</DetailTerm>
            <DetailTerm label="Email">
              <span className="break-all">{thread.adopter?.email ?? '—'}</span>
            </DetailTerm>
            <DetailTerm label="Preferred slot">{thread.preferredSlot}</DetailTerm>
            <DetailTerm label="Confirmed slot">
              {thread.confirmedSlot ?? 'Not confirmed yet'}
            </DetailTerm>
            <DetailTerm label="Last update">{formatDate(thread.updatedAt)}</DetailTerm>
          </dl>

          <div className="rounded-lg border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Reason for visit
            </p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
              {thread.reason?.trim() || 'No reason provided.'}
            </p>
          </div>

          {thread.shelterMessage ? (
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Email sent to the adopter
              </p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
                {thread.shelterMessage}
              </p>
            </div>
          ) : null}

          {thread.status === 'cancelled' && thread.cancelReason ? (
            <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
              Note: {thread.cancelReason}
            </p>
          ) : null}

          {!actionable ? (
            <p className="text-xs text-muted-foreground">
              This visit request is closed. Its status and email history stay here for reference.
            </p>
          ) : null}
        </div>
      ) : null}
    </DetailsModal>
  );
};
