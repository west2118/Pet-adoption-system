import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { ApiError } from '@/lib/apiClient';
import { userService } from '@/services/api';
import type { UserRole } from '@/types';

export const ADMIN_USERS_QUERY_KEY = ['adminUsers'] as const;

interface UseAdminUserMutationsOptions {
  onUpdated?: () => void;
}

export const useAdminUserMutations = ({
  onUpdated,
}: UseAdminUserMutationsOptions = {}) => {
  const queryClient = useQueryClient();

  const updateRoleMutation = useMutation({
    mutationFn: ({
      userId,
      role,
      shelterId,
    }: {
      userId: string;
      role: UserRole;
      shelterId?: string;
    }) => userService.updateRole(userId, role, shelterId),
    onSuccess: (updated) => {
      toast.success(`${updated.name}'s role updated successfully!`);
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
      onUpdated?.();
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to update role. Please try again.',
      );
    },
  });

  return {
    updateRoleMutation,
    isUpdating: updateRoleMutation.isPending,
  };
};

