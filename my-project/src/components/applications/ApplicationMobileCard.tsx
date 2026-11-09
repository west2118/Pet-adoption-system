import { MobileRecordCard } from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { ApplicationStatusBadge } from '@/components/ui/StatusBadge';
import type { AdoptionApplication } from '@/types';
import { formatDate } from '@/utils/formatters';

import { ApplicationActions } from './ApplicationActions';
import type { DecisionAction } from './types';
import { WaiverStatusIndicator } from './WaiverStatusIndicator';

interface ApplicationMobileCardProps {
  app: AdoptionApplication;
  /** Pet summary joined onto the application, used for the photo and name. */
  petName?: string;
  petImageUrl?: string;
  onView: (app: AdoptionApplication) => void;
  onDecision: (app: AdoptionApplication, action: DecisionAction) => void;
  onOpenWaiver: (id: string) => void;
}

/** Small-screen card for one adoption application. */
export const ApplicationMobileCard = ({
  app,
  petName,
  petImageUrl,
  onView,
  onDecision,
  onOpenWaiver,
}: ApplicationMobileCardProps) => (
  <MobileRecordCard
    media={
      petImageUrl ? (
        <img
          src={petImageUrl}
          alt={petName ?? ''}
          className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-border/60"
        />
      ) : undefined
    }
    title={app.applicantName}
    subtitle={app.email}
    status={<ApplicationStatusBadge status={app.status} />}
    badges={
      <>
        <WaiverStatusIndicator app={app} />
        <Badge variant="muted" className="capitalize">
          {app.housingType}
        </Badge>
      </>
    }
    meta={`Submitted ${formatDate(app.submittedAt)}`}
    actions={
      <ApplicationActions
        app={app}
        petName={petName}
        round
        onView={onView}
        onDecision={onDecision}
        onOpenWaiver={onOpenWaiver}
      />
    }
  >
    <p className="text-sm text-muted-foreground">
      Applying for <span className="font-medium text-foreground">{petName ?? '—'}</span>
    </p>
  </MobileRecordCard>
);
