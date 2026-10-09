import { cn } from '@/lib/utils';
import type { ApplicationStatus, PetStatus, PetVisibility } from '@/types';
import { Badge } from './Badge';

export const PetStatusBadge = ({ status }: { status: PetStatus }) => {
  return (
    <Badge
      variant={
        status === 'Available'
          ? 'success'
          : status === 'In Process'
            ? 'warning'
            : status === 'Adopted'
              ? 'info'
              : 'muted'
      }
      className={cn('uppercase tracking-wide')}
    >
      {status}
    </Badge>
  );
};

export const ApplicationStatusBadge = ({ status }: { status: ApplicationStatus }) => {
  const variant =
    status === 'Approved' || status === 'Adopted'
      ? 'success'
      : status === 'Under Review'
        ? 'warning'
        : status === 'Rejected'
          ? 'destructive'
          : 'info';
  return <Badge variant={variant}>{status}</Badge>;
};

export const VisibilityBadge = ({ visibility }: { visibility: PetVisibility }) => {
  return (
    <Badge variant={visibility === 'public' ? 'success' : 'muted'}>
      {visibility === 'public' ? 'Public' : 'Private'}
    </Badge>
  );
};
