import { Pencil, UserCog } from 'lucide-react';

import { DetailsModal } from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { accountTypeOf } from '@/data/shelterUsers';
import type { User } from '@/types';

import { AccountTypeBadge } from './AccountTypeBadge';
import { UserAvatar } from './UserAvatar';

export interface ShelterUserDetailsModalProps {
  user: User | null;
  shelterName: string;
  canManage: boolean;
  onClose: () => void;
  onEdit: (user: User) => void;
}

/** Read-only account view with an Edit shortcut for shelter admins. */
export const ShelterUserDetailsModal = ({
  user,
  shelterName,
  canManage,
  onClose,
  onEdit,
}: ShelterUserDetailsModalProps) => (
  <DetailsModal
    open={user !== null}
    onClose={onClose}
    title={user?.name ?? 'User details'}
    description={user?.email}
    icon={UserCog}
    footer={
      user ? (
        <div className={canManage ? 'grid grid-cols-2 gap-3' : 'flex justify-end'}>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={onClose}
          >
            Close
          </Button>
          {canManage ? (
            <Button type="button" size="lg" className="w-full" onClick={() => onEdit(user)}>
              <Pencil className="size-4" /> Edit
            </Button>
          ) : undefined}
        </div>
      ) : undefined
    }
  >
    {user && (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="lg" />
          <div className="flex flex-wrap gap-1.5">
            <AccountTypeBadge user={user} />
            <Badge variant="muted">{shelterName} only</Badge>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border p-2.5">
            <dt className="text-xs text-muted-foreground">Email</dt>
            <dd className="break-all font-medium">{user.email}</dd>
          </div>
          <div className="rounded-lg border p-2.5">
            <dt className="text-xs text-muted-foreground">Account type</dt>
            <dd className="font-medium capitalize">{accountTypeOf(user)}</dd>
          </div>
          <div className="rounded-lg border p-2.5">
            <dt className="text-xs text-muted-foreground">Shelter access</dt>
            <dd className="font-medium">{shelterName}</dd>
          </div>
          <div className="rounded-lg border p-2.5">
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd className="font-medium capitalize">{user.accountStatus ?? 'approved'}</dd>
          </div>
        </dl>
      </div>
    )}
  </DetailsModal>
);
