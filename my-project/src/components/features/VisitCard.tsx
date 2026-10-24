import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { VisitStatus, VisitThread } from '@/types';
import { formatDate } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { VisitStatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Label, Textarea } from '@/components/ui/Form';
import { visitService } from '@/services/visitService';
import { toast } from 'react-toastify';
import { ApiError } from '@/lib/apiClient';

/** The happy path a visit walks, in order. `Cancelled` sits off this track. */
const STAGES: VisitStatus[] = ['requested', 'confirmed', 'completed'];

const stageIndex = (thread: VisitThread): number => {
  if (thread.status === 'cancelled') return -1;
  return STAGES.indexOf(thread.status);
};

const RAIL_INSET = (100 / STAGES.length / 2).toString();

/** Horizontal progress track showing how far a visit request has travelled. */
const StatusTrack = ({ thread }: { thread: VisitThread }) => {
  const current = stageIndex(thread);

  if (thread.status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex size-5 items-center justify-center rounded-full bg-muted">
          <X className="size-3" />
        </span>
        Closed — this visit request was cancelled or declined.
      </div>
    );
  }

  const travelled = (current / (STAGES.length - 1)) * (100 - Number(RAIL_INSET) * 2);

  return (
    <ol className="relative flex w-full items-start">
      <span
        aria-hidden="true"
        className="absolute top-2.5 h-px -translate-y-1/2 bg-border"
        style={{ left: `${RAIL_INSET}%`, right: `${RAIL_INSET}%` }}
      />
      <span
        aria-hidden="true"
        className="absolute top-2.5 h-px -translate-y-1/2 bg-primary"
        style={{ left: `${RAIL_INSET}%`, width: `${travelled}%` }}
      />

      {STAGES.map((stage, i) => {
        const done = i <= current;
        const isCurrent = i === current;

        return (
          <li key={stage} className="relative flex-1">
            <span className="relative flex flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full border transition-colors',
                  done ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background',
                )}
              >
                {done && <Check className="size-3" />}
              </span>
              <span
                className={cn(
                  'font-mono text-[10px] uppercase leading-tight tracking-[0.14em]',
                  isCurrent ? 'text-foreground' : done ? 'text-muted-foreground' : 'text-muted-foreground/50',
                )}
              >
                {stage}
              </span>
              <span className="text-[11px] leading-tight text-muted-foreground">
                {isCurrent ? 'in progress' : done ? 'done' : '—'}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
};

interface VisitCardProps {
  thread: VisitThread;
  onChanged: () => void;
}

/**
 * Adopter visit request card: pet photo, status, slot summary, progress
 * track, and cancellation. There is no conversation — the shelter emails
 * the decision.
 */
export const VisitCard = ({ thread, onChanged }: VisitCardProps) => {
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);

  const closed = thread.status === 'completed' || thread.status === 'cancelled';

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await visitService.cancelMine(thread.id, cancelReason.trim() || undefined);
      toast.success('Visit request cancelled.');
      setShowCancel(false);
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to cancel visit.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/40">
      <div className="flex flex-col gap-6 p-6 sm:flex-row lg:gap-8">
        {thread.pet && (
          <Link
            to={`/pets/${thread.petId}`}
            className="shrink-0 overflow-hidden rounded-lg bg-muted sm:self-start"
          >
            <img
              src={thread.pet.imageUrl}
              alt={thread.pet.name}
              className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out hover:scale-105 sm:w-40"
            />
          </Link>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-medium leading-snug">
                  {thread.pet ? thread.pet.name : thread.petId}
                </h3>
                <VisitStatusBadge status={thread.status} />
              </div>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                Preferred {thread.preferredSlot}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {thread.confirmedSlot
                  ? `Confirmed ${thread.confirmedSlot}`
                  : thread.status === 'cancelled'
                    ? 'This request was cancelled or declined by the shelter.'
                    : 'Waiting on the shelter team to approve or decline this request by email.'}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Link to={`/pets/${thread.petId}`}>
                <Button variant="outline" size="sm">
                  View pet
                </Button>
              </Link>
              {!closed && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setShowCancel((v) => !v)}
                >
                  <X className="size-3.5" /> Cancel request
                </Button>
              )}
            </div>
          </div>

          {showCancel && !closed ? (
            <div className="mt-5 space-y-2 rounded-lg border p-3">
              <Label htmlFor={`cancel-${thread.id}`}>Cancellation note (optional)</Label>
              <Textarea
                id={`cancel-${thread.id}`}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Let the shelter know why…"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => void handleCancel()}
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling…' : 'Confirm cancellation'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowCancel(false)} disabled={cancelling}>
                  Keep request
                </Button>
              </div>
            </div>
          ) : null}

          <div className="mt-6 border-t border-border pt-6">
            <StatusTrack thread={thread} />
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Requested {formatDate(thread.createdAt)}
            {thread.confirmedSlot ? ` · confirmed ${thread.confirmedSlot}` : ''}
          </p>
        </div>
      </div>
    </article>
  );
};
