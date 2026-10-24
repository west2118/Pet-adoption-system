import { AlertTriangle, Ban, Check, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { AdoptionApplication, ApplicationStatus, Pet } from '@/types';
import { formatDate } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/apiClient';
import { adoptionApplicationService } from '@/services/adoptionApplicationService';
import { DetailsModal } from '@/components/shared/DetailsModal';
import { ApplicationDetailsModal } from '@/components/features/ApplicationDetailsModal';
import { ApplicationStatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Label, Textarea } from '@/components/ui/Form';

/** The happy path an application walks, in order. `Rejected` sits off this track. */
const STAGES: ApplicationStatus[] = ['Submitted', 'Under Review', 'Approved', 'Adopted'];

const stageIndex = (application: AdoptionApplication): number => {
  if (application.status === 'Rejected' || application.status === 'Cancelled') return -1;
  const reached = new Set<ApplicationStatus>([
    ...application.history.map((h) => h.status),
    application.status,
  ]);
  return STAGES.reduce((furthest, stage, i) => (reached.has(stage) ? i : furthest), 0);
};

const stageDate = (
  application: AdoptionApplication,
  stage: ApplicationStatus,
): string | undefined => application.history.find((h) => h.status === stage)?.date;

interface StatusTrackProps {
  application: AdoptionApplication;
}

/**
 * Distance from the track's edge to the first/last circle centre, as a percentage.
 * Every stage is an equal `flex-1` column, so with four stages the centres sit at
 * 12.5% / 37.5% / 62.5% / 87.5% of the track width.
 */
const RAIL_INSET = (100 / STAGES.length / 2).toString();

/** Horizontal progress track showing how far an application has travelled. */
const StatusTrack = ({ application }: StatusTrackProps) => {
  const current = stageIndex(application);
  const rejected = application.status === 'Rejected';

  if (rejected) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <span className="flex size-5 items-center justify-center rounded-full bg-destructive/10">
          <X className="size-3" />
        </span>
        Not moving forward — this application was declined by the shelter.
      </div>
    );
  }

  if (application.status === 'Cancelled') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex size-5 items-center justify-center rounded-full bg-muted">
          <Ban className="size-3" />
        </span>
        You cancelled this application.
      </div>
    );
  }

  // The rail is drawn once across the whole track rather than per stage, so it
  // always reaches both circles. A per-stage connector only spanned half of each
  // gap, which left the line visibly broken between stages.
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
        const date = stageDate(application, stage);

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
                {date ? formatDate(date) : isCurrent ? 'in progress' : '—'}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
};

interface ApplicationCardProps {
  application: AdoptionApplication;
  pet?: Pet;
  showApplicant?: boolean;
  onStatusChange?: (id: string, status: AdoptionApplication['status']) => void;
  /** Called after the adopter withdraws — the page should refetch the list. */
  onChanged?: () => void;
}

export const ApplicationCard = ({
  application,
  pet,
  showApplicant,
  onStatusChange,
  onChanged,
}: ApplicationCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const canCancel =
    application.status === 'Submitted' || application.status === 'Under Review';
  // The pet may have left the public catalogue (In Process / Adopted), so fall
  // back to the pet summary returned with the application.
  const petInfo = pet ?? application.pet;

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await adoptionApplicationService.cancelMine(
        application.id,
        cancelReason.trim() || undefined,
      );
      toast.success('Application cancelled.');
      setCancelOpen(false);
      setCancelReason('');
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to cancel application.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/40">
      <div className="flex flex-col gap-6 p-6 sm:flex-row lg:gap-8">
        {petInfo && (
          /* `sm:self-start` matters: from `sm` up the card is a row, so the default
             `align-items: stretch` made this link as tall as the text column and the
             `bg-muted` showed as a grey band under the photo. Below `sm` the card is a
             column, where the link should keep stretching to the card's full width. */
          <Link
            to={`/pets/${application.petId}`}
            className="shrink-0 overflow-hidden rounded-lg bg-muted sm:self-start"
          >
            <img
              src={petInfo.imageUrl}
              alt={petInfo.name}
              className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out hover:scale-105 sm:w-40"
            />
          </Link>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-medium leading-snug">
                  {petInfo ? petInfo.name : application.petId}
                </h3>
                <ApplicationStatusBadge status={application.status} />
              </div>
              {petInfo?.breed && (
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                  {petInfo.breed}
                </p>
              )}
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {showApplicant
                  ? `${application.applicantName} · ${application.email}`
                  : application.reason}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailsOpen(true)}
              >
                View details
              </Button>
              {onStatusChange ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => onStatusChange(application.id, 'Approved')}>
                    Approve
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onStatusChange(application.id, 'Rejected')}>
                    Reject
                  </Button>
                </>
              ) : (
                <>
                  {canCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setCancelOpen(true)}
                    >
                      <Ban className="size-3.5" /> Cancel application
                    </Button>
                  )}
                  {application.status === 'Adopted' && (
                    <Link to={`/applications/${application.id}/waiver`}>
                      <Button variant="outline" size="sm">
                        View waiver
                      </Button>
                    </Link>
                  )}
                  <Link to={`/pets/${application.petId}`}>
                    <Button variant="outline" size="sm">
                      View pet
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <StatusTrack application={application} />
          </div>
        </div>
      </div>

      <ApplicationDetailsModal
        application={application}
        pet={pet}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />

      <DetailsModal
        open={cancelOpen}
        onClose={cancelling ? () => undefined : () => setCancelOpen(false)}
        title="Cancel this application?"
        description={petInfo ? `${petInfo.name} · ${application.email}` : application.email}
        icon={AlertTriangle}
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            This withdraws your application for{' '}
            <span className="font-medium text-foreground">{petInfo?.name ?? 'this pet'}</span>. It
            cannot be undone, and a confirmation email will be sent to{' '}
            <span className="font-medium text-foreground">{application.email}</span>.
          </p>
          <div>
            <Label htmlFor={`cancel-reason-${application.id}`}>Reason (optional)</Label>
            <Textarea
              id={`cancel-reason-${application.id}`}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Let the shelter know why you are withdrawing…"
              disabled={cancelling}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCancelOpen(false)}
              disabled={cancelling}
            >
              Keep application
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => void handleCancel()}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling…' : 'Cancel application'}
            </Button>
          </div>
        </div>
      </DetailsModal>
    </article>
  );
};
