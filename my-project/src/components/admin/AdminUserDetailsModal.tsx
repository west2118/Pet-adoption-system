import { Pencil, Users } from 'lucide-react';

import { DetailsModal } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { UserRoleBadge } from '@/components/ui/StatusBadge';
import { UserAvatar } from '@/components/users';
import type { User } from '@/types';

export interface AdminUserDetailsModalProps {
  user: User | null;
  shelterName: string;
  onClose: () => void;
  onEdit: (user: User) => void;
}

export const AdminUserDetailsModal = ({
  user,
  shelterName,
  onClose,
  onEdit,
}: AdminUserDetailsModalProps) => (
  <DetailsModal
    open={user !== null}
    onClose={onClose}
    title={user?.name ?? 'User details'}
    description={user?.email}
    icon={Users}
    footer={
      <div className="flex w-full gap-2">
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          onClick={() => {
            if (user) onEdit(user);
          }}
        >
          <Pencil className="size-4" /> Edit role
        </Button>
        <Button size="lg" variant="outline" className="flex-1" onClick={onClose}>
          Close
        </Button>
      </div>
    }
  >
    {user && (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <UserAvatar name={user.name} size="lg" />
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-1">
              <UserRoleBadge role={user.role} />
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border p-2.5">
            <dt className="text-xs text-muted-foreground">User ID</dt>
            <dd className="font-mono text-xs">{user.id}</dd>
          </div>
          <div className="rounded-lg border p-2.5">
            <dt className="text-xs text-muted-foreground">Assigned shelter</dt>
            <dd className="font-medium">
              {user.shelterId ? shelterName : 'None'}
            </dd>
          </div>
        </dl>
      </div>
    )}
  </DetailsModal>
);

