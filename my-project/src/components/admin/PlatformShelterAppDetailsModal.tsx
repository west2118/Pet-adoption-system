import { Building2, Check, Clock, Mail, MapPin, Phone, ShieldCheck, X } from 'lucide-react';

import { DetailsModal } from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import type { ShelterApplication } from '@/types';
import { formatDate } from '@/utils/formatters';

export interface PlatformShelterAppDetailsModalProps {
  app: ShelterApplication | null;
  isWorking: boolean;
  onClose: () => void;
  onApprove: (app: ShelterApplication) => void;
  onReject: (app: ShelterApplication) => void;
  onResendEmail: (id: string) => void;
}

export const PlatformShelterAppDetailsModal = ({
  app,
  isWorking,
  onClose,
  onApprove,
  onReject,
  onResendEmail,
}: PlatformShelterAppDetailsModalProps) => (
  <DetailsModal
    open={app !== null}
    onClose={onClose}
    title={app?.name ?? 'Shelter Application'}
    description={`Submitted ${app ? formatDate(app.submittedAt) : ''}`}
    icon={Building2}
    footer={
      <div className="flex w-full items-center justify-between gap-2">
        <div>
          {app && app.status !== 'pending' && app.email && !app.emailSent ? (
            <Button
              size="sm"
              variant="outline"
              disabled={isWorking}
              onClick={() => onResendEmail(app.id)}
            >
              <Mail className="mr-1.5 size-3.5" /> Resend notification email
            </Button>
          ) : null}
        </div>
        <div className="flex gap-2">
          {app?.status === 'pending' ? (
            <>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => onApprove(app)}
              >
                <Check className="mr-1.5 size-3.5" /> Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject(app)}
              >
                <X className="mr-1.5 size-3.5" /> Reject
              </Button>
            </>
          ) : null}
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    }
  >
    {app && (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={
              app.status === 'approved'
                ? 'success'
                : app.status === 'rejected'
                  ? 'destructive'
                  : 'warning'
            }
          >
            {app.status.toUpperCase()}
          </Badge>
        </div>

        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-lg border p-2.5">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="size-3.5" /> Email
            </dt>
            <dd className="break-all font-medium">{app.email}</dd>
          </div>
          <div className="rounded-lg border p-2.5">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="size-3.5" /> Phone
            </dt>
            <dd className="font-medium">{app.phone || '—'}</dd>
          </div>
          <div className="rounded-lg border p-2.5">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" /> Applicant Name
            </dt>
            <dd className="font-medium">{app.applicantName || app.name}</dd>
          </div>
          <div className="rounded-lg border p-2.5">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" /> Operating Hours
            </dt>
            <dd className="font-medium">{app.operatingHours || '—'}</dd>
          </div>
          <div className="col-span-full rounded-lg border p-2.5">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" /> Address
            </dt>
            <dd className="font-medium">
              {app.address}, {app.location}
            </dd>
          </div>
        </dl>

        {app.description ? (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Mission & Description
            </h4>
            <p className="mt-1 whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed">
              {app.description}
            </p>
          </div>
        ) : null}

        {app.status !== 'pending' && app.reviewNote ? (
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Reviewer note ({app.status})
            </h4>
            <p className="mt-1 text-sm text-foreground">{app.reviewNote}</p>
            {app.reviewedAt ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Reviewed on {formatDate(app.reviewedAt)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    )}
  </DetailsModal>
);

