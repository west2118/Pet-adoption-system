import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { ApiError } from '@/lib/apiClient';
import { userService } from '@/services/api';
import type { UserRole } from '@/types';

export const ADMIN_USERS_QUERY_KEY = ['adminUsers'] as const;

interface UseAdminUserMutationsOptions {
  onUpdated?: () => void;
  onDeleted?: () => void;
}

export const useAdminUserMutations = ({
  onUpdated,
  onDeleted,
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

  const deleteUserMutation = useMutation({
    mutationFn: ({ userId }: { userId: string; userName: string }) =>
      userService.deleteUser(userId),
    onSuccess: (_data, variables) => {
      toast.success(`${variables.userName} was deleted successfully.`);
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
      onDeleted?.();
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to delete user. Please try again.',
      );
    },
  });

  return {
    updateRoleMutation,
    deleteUserMutation,
    isUpdating: updateRoleMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
  };
};

