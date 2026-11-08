import { ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { accountTypeOf } from '@/data/shelterUsers';
import type { User } from '@/types';

export const AccountTypeBadge = ({ user }: { user: User }) => {
  const isAdmin = accountTypeOf(user) === 'admin';
  return (
    <Badge variant={isAdmin ? 'info' : 'muted'}>
      {isAdmin ? (
        <>
          <ShieldCheck className="mr-1 size-3.5" /> Admin
        </>
      ) : (
        'Staff'
      )}
    </Badge>
  );
};
