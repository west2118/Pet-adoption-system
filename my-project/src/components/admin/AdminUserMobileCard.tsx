import { Eye, Pencil } from 'lucide-react';

import { MobileRecordCard } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { UserRoleBadge } from '@/components/ui/StatusBadge';
import { UserAvatar } from '@/components/users';
import type { User } from '@/types';

export interface AdminUserMobileCardProps {
  user: User;
  shelterName: string;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
}

export const AdminUserMobileCard = ({
  user,
  shelterName,
  onView,
  onEdit,
}: AdminUserMobileCardProps) => (
  <MobileRecordCard
    media={<UserAvatar name={user.name} size="xl" />}
    title={user.name}
    subtitle={user.email}
    status={<UserRoleBadge role={user.role} />}
    meta={user.shelterId ? `Assigned: ${shelterName}` : 'No shelter assigned'}
    actions={
      <>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground"
          aria-label={`View ${user.name} details`}
          onClick={() => onView(user)}
        >
          <Eye className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
          aria-label={`Edit ${user.name} role`}
          onClick={() => onEdit(user)}
        >
          <Pencil className="size-4" />
        </Button>
      </>
    }
  />
);

