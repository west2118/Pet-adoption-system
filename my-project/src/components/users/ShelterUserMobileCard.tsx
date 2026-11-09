import { Eye, Pencil, Trash2 } from 'lucide-react';

import { MobileRecordCard } from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';

import { AccountTypeBadge } from './AccountTypeBadge';
import { UserAvatar } from './UserAvatar';

export interface ShelterUserMobileCardProps {
  account: User;
  shelterName: string;
  canManage: boolean;
  isSelf: boolean;
  onView: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

/** Small-screen card for one staff or admin account. */
export const ShelterUserMobileCard = ({
  account,
  shelterName,
  canManage,
  isSelf,
  onView,
  onEdit,
  onRemove,
}: ShelterUserMobileCardProps) => (
  <MobileRecordCard
    media={<UserAvatar name={account.name} avatarUrl={account.avatarUrl} size="xl" />}
    title={
      <>
        {account.name}
        {isSelf ? (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
        ) : null}
      </>
    }
    subtitle={account.email}
    status={
      <Badge variant={account.accountStatus === 'pending' ? 'warning' : 'success'}>
        {account.accountStatus === 'pending' ? 'Pending' : 'Active'}
      </Badge>
    }
    badges={<AccountTypeBadge user={account} />}
    meta={`${shelterName} only`}
    actions={
      <>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground"
          aria-label={`View ${account.name} details`}
          onClick={onView}
        >
          <Eye className="size-4" />
        </Button>
        {canManage ? (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground"
            aria-label={`Edit ${account.name}`}
            onClick={onEdit}
          >
            <Pencil className="size-4" />
          </Button>
        ) : null}
        {canManage && !isSelf ? (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
            aria-label={`Remove ${account.name}`}
            onClick={onRemove}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </>
    }
  />
);
