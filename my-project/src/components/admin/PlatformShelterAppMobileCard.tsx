import { Building2, Check, Clock, Eye, X } from 'lucide-react';

import { MobileRecordCard } from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import type { ShelterApplication } from '@/types';
import { formatDate } from '@/utils/formatters';

export interface PlatformShelterAppMobileCardProps {
  app: ShelterApplication;
  onView: (app: ShelterApplication) => void;
  onApprove: (app: ShelterApplication) => void;
  onReject: (app: ShelterApplication) => void;
}

export const PlatformShelterAppMobileCard = ({
  app,
  onView,
  onApprove,
  onReject,
}: PlatformShelterAppMobileCardProps) => (
  <MobileRecordCard
    media={
      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border bg-muted/50 text-muted-foreground ring-1 ring-border/60">
        <Building2 className="size-6" />
      </div>
    }
    title={app.name}
    subtitle={app.location}
    status={
      <Badge
        variant={
          app.status === 'approved'
            ? 'success'
            : app.status === 'rejected'
              ? 'destructive'
              : 'warning'
        }
      >
        {app.status === 'pending' ? <Clock className="mr-1 inline-block size-3" /> : null}
        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
      </Badge>
    }
    badges={
      <span className="text-xs text-muted-foreground">
        {app.applicantName || app.name} · {app.email}
      </span>
    }
    meta={`Submitted ${formatDate(app.submittedAt)}`}
    actions={
      <>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground"
          aria-label={`View ${app.name} details`}
          onClick={() => onView(app)}
        >
          <Eye className="size-4" />
        </Button>
        {app.status === 'pending' ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
              aria-label={`Approve ${app.name}`}
              onClick={() => onApprove(app)}
            >
              <Check className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Reject ${app.name}`}
              onClick={() => onReject(app)}
            >
              <X className="size-4" />
            </Button>
          </>
        ) : null}
      </>
    }
  />
);

