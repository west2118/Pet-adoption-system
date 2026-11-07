import { ApplicationStatusBadge } from '@/components/ui/StatusBadge';
import { RecordCard } from '@/components/shared';
import type { AdoptionApplication } from '@/types';

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
}: ApplicationMobileCardProps) => {
  return (
    <RecordCard
      imageUrl={petImageUrl}
      imageAlt={petName}
      title={app.applicantName}
      subtitle={app.email}
      badges={
        <>
          <ApplicationStatusBadge status={app.status} />
          <WaiverStatusIndicator app={app} />
        </>
      }
      actions={
        <ApplicationActions
          app={app}
          petName={petName}
          onView={onView}
          onDecision={onDecision}
          onOpenWaiver={onOpenWaiver}
        />
      }
    >
      <p className="text-sm text-muted-foreground">
        Applying for <span className="font-medium text-foreground">{petName ?? '—'}</span>
      </p>
    </RecordCard>
  );
};
