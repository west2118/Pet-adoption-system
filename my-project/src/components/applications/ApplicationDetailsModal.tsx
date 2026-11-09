import { Ban, Check, ClipboardList, HeartHandshake, Printer, Undo2, X } from 'lucide-react';

import { DetailsModal } from '@/components/shared';
import { ApplicationStatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import type { AdoptionApplication } from '@/types';
import { formatDate, formatDateTime } from '@/utils/formatters';

import type { DecisionAction } from './types';
import { WaiverStatusIndicator } from './WaiverStatusIndicator';
import { canPrintWaiver, waiverStatusOf } from './waiver';

interface ApplicationPet {
  name: string;
  imageUrl?: string;
  breed?: string;
}

interface ApplicationDetailsModalProps {
  app: AdoptionApplication | null;
  /** Pet summary joined onto the application (or the public pet record). */
  pet?: ApplicationPet | null;
  onClose: () => void;
  onDecision: (app: AdoptionApplication, action: DecisionAction) => void;
  onOpenWaiver: (id: string) => void;
}

/** Read-only view of one adoption application, with its next-step actions. */
export const ApplicationDetailsModal = ({
  app,
  pet,
  onClose,
  onDecision,
  onOpenWaiver,
}: ApplicationDetailsModalProps) => {
  const footer = app ? (
    <div className="flex flex-col gap-2">
      {canPrintWaiver(app) && (
        <Button size="sm" variant="outline" className="w-full" onClick={() => onOpenWaiver(app.id)}>
          <Printer className="size-3.5" /> Print e-waiver
        </Button>
      )}
      {app.status === 'Approved' ? (
        <>
          <Button
            size="sm"
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => onDecision(app, 'Adopted')}
          >
            <HeartHandshake className="size-4" />
            {waiverStatusOf(app) === 'None'
              ? 'Generate waiver & mark adopted'
              : 'Mark as adopted & open e-waiver'}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="w-full"
            onClick={() => onDecision(app, 'Cancelled')}
          >
            <Ban className="size-4" /> Cancel adoption
          </Button>
        </>
      ) : app.status === 'Adopted' ? (
        <Button
          size="sm"
          variant="destructive"
          className="w-full"
          onClick={() => onDecision(app, 'Return')}
        >
          <Undo2 className="size-4" /> Return pet to the shelter
        </Button>
      ) : app.status === 'Rejected' ||
        app.status === 'Cancelled' ||
        app.status === 'Returned' ? null : (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-green-600 text-white hover:bg-green-700"
            onClick={() => onDecision(app, 'Approved')}
          >
            <Check className="size-4" /> Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            onClick={() => onDecision(app, 'Rejected')}
          >
            <X className="size-4" /> Reject
          </Button>
        </div>
      )}
    </div>
  ) : undefined;

  return (
    <DetailsModal
      open={app !== null}
      onClose={onClose}
      title={app?.applicantName ?? 'Application details'}
      description={app ? `${app.email} · ${app.phone}` : undefined}
      icon={ClipboardList}
      footer={footer}
    >
      {app && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {pet ? (
              <img
                src={pet.imageUrl}
                alt={pet.name}
                className="size-14 rounded-lg object-cover"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{pet?.name ?? 'Unknown pet'}</p>
              <p className="truncate text-xs text-muted-foreground">{pet?.breed ?? '—'}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <ApplicationStatusBadge status={app.status} />
              <WaiverStatusIndicator app={app} />
            </div>
          </div>

          {waiverStatusOf(app) === 'None' && app.status === 'Approved' ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              No handover waiver has been issued. Marking this adoption as complete will open the
              waiver builder first.
            </p>
          ) : null}
          {waiverStatusOf(app) === 'None' && app.status === 'Adopted' ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              This adoption has no waiver on file. Generate one now to complete the handover record.
            </p>
          ) : null}

          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border p-2.5">
              <dt className="text-xs text-muted-foreground">Housing</dt>
              <dd className="font-medium capitalize">{app.housingType}</dd>
            </div>
            <div className="rounded-lg border p-2.5">
              <dt className="text-xs text-muted-foreground">Other pets</dt>
              <dd className="font-medium">{app.hasOtherPets ? 'Yes' : 'No'}</dd>
            </div>
            <div className="rounded-lg border p-2.5">
              <dt className="text-xs text-muted-foreground">Phone</dt>
              <dd className="truncate font-medium">{app.phone}</dd>
            </div>
            <div className="rounded-lg border p-2.5">
              <dt className="text-xs text-muted-foreground">Address</dt>
              <dd className="truncate font-medium">{app.address}</dd>
            </div>
          </dl>

          {app.pickupAt ? (
            <div className="rounded-lg border border-green-600/30 bg-green-50/60 p-3 dark:bg-green-950/20">
              <h3 className="text-sm font-semibold">Pickup scheduled</h3>
              <p className="mt-1 text-sm">{formatDateTime(app.pickupAt)}</p>
              {app.pickupEmail ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Contact:{' '}
                  <a className="underline underline-offset-2" href={`mailto:${app.pickupEmail}`}>
                    {app.pickupEmail}
                  </a>
                </p>
              ) : null}
            </div>
          ) : null}

          <div>
            <h3 className="text-sm font-semibold">Experience</h3>
            <p className="mt-1 text-sm text-muted-foreground">{app.experience}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Reason for adopting</h3>
            <p className="mt-1 text-sm text-muted-foreground">{app.reason}</p>
          </div>
          {app.staffNotes ? (
            <div>
              <h3 className="text-sm font-semibold">Staff notes</h3>
              <p className="mt-1 text-sm text-muted-foreground">{app.staffNotes}</p>
            </div>
          ) : null}

          <div>
            <h3 className="text-sm font-semibold">Status history</h3>
            <ol className="mt-2 space-y-1.5 text-sm">
              {app.history.map((entry, index) => (
                <li
                  key={`${entry.status}-${entry.date}-${index}`}
                  className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-1.5"
                >
                  <span className="font-medium">{entry.status}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(entry.date)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </DetailsModal>
  );
};
