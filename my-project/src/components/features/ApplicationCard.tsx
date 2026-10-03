import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { AdoptionApplication, ApplicationStatus, Pet } from '@/types';
import { formatDate } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { ApplicationDetailsModal } from '@/components/features/ApplicationDetailsModal';
import { ApplicationStatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';

/** The happy path an application walks, in order. `Rejected` sits off this track. */
const STAGES: ApplicationStatus[] = ['Submitted', 'Under Review', 'Approved', 'Adopted'];

const stageIndex = (application: AdoptionApplication): number => {
  if (application.status === 'Rejected') return -1;
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
}

export const ApplicationCard = ({
  application,
  pet,
  showApplicant,
  onStatusChange,
}: ApplicationCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/40">
      <div className="flex flex-col gap-6 p-6 sm:flex-row lg:gap-8">
        {pet && (
          /* `sm:self-start` matters: from `sm` up the card is a row, so the default
             `align-items: stretch` made this link as tall as the text column and the
             `bg-muted` showed as a grey band under the photo. Below `sm` the card is a
             column, where the link should keep stretching to the card's full width. */
          <Link
            to={`/pets/${application.petId}`}
            className="shrink-0 overflow-hidden rounded-lg bg-muted sm:self-start"
          >
            <img
              src={pet.imageUrl}
              alt={pet.name}
              className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out hover:scale-105 sm:w-40"
            />
          </Link>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-medium leading-snug">
                  {pet ? pet.name : application.petId}
                </h3>
                <ApplicationStatusBadge status={application.status} />
              </div>
              {pet && (
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                  {pet.breed}
                </p>
              )}
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {showApplicant
                  ? `${application.applicantName} · ${application.email}`
                  : application.reason}
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
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
                <Link to={`/pets/${application.petId}`}>
                  <Button variant="outline" size="sm">
                    View pet
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <StatusTrack application={application} />
          </div>

          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Submitted {formatDate(application.submittedAt)} · Updated{' '}
            {formatDate(application.updatedAt)}
          </p>
        </div>
      </div>

      <ApplicationDetailsModal
        application={application}
        pet={pet}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </article>
  );
};
