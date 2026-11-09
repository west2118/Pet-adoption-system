import { Badge } from '@/components/ui/Badge';
import type { AdoptionApplication } from '@/types';
import { formatDateTime } from '@/utils/formatters';

import { waiverStatusOf } from './waiver';

/** At-a-glance handover-document state used in tables, cards and details. */
export const WaiverStatusIndicator = ({ app }: { app: AdoptionApplication }) => {
  const status = waiverStatusOf(app);

  if (status === 'Signed') {
    return (
      <Badge
        variant="success"
        title={
          app.waiverSignedAt
            ? `Signed ${formatDateTime(app.waiverSignedAt)}`
            : 'Signed waiver on file'
        }
      >
        Signed{app.waiverVersion ? ` v${app.waiverVersion}` : ''}
      </Badge>
    );
  }
  if (status === 'Issued') {
    return (
      <Badge variant="info" title="Issued but waiting for the adopter's signature">
        Issued{app.waiverVersion ? ` v${app.waiverVersion}` : ''}
      </Badge>
    );
  }
  if (app.status === 'Adopted') {
    return (
      <Badge variant="destructive" title="Adopted without handover documents on file">
        Missing
      </Badge>
    );
  }
  if (app.status === 'Approved') {
    return (
      <Badge variant="warning" title="Generate the waiver before completing the adoption">
        Not issued
      </Badge>
    );
  }
  return <span className="text-xs text-muted-foreground">—</span>;
};
