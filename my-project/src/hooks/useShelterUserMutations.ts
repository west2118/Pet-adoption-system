import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { ApiError } from '@/lib/apiClient';
import {
  createShelterUser,
  removeShelterUser,
  updateShelterUser,
} from '@/services/api';
import type { CreateShelterUserInput, UpdateShelterUserInput } from '@/services/api';

interface CreateShelterUserVariables {
  input: CreateShelterUserInput;
  /** Named in the success toast so the account's scope is obvious. */
  shelterName: string;
}

interface UpdateShelterUserVariables {
  id: string;
  updates: UpdateShelterUserInput;
}

interface RemoveShelterUserVariables {
  id: string;
  name: string;
}

interface UseShelterUserMutationsOptions {
  onCreated?: () => void;
  onUpdated?: () => void;
  onDeleted?: () => void;
}

export const SHELTER_USERS_QUERY_KEY = ['shelterUsers'] as const;

/**
 * Create/update/remove mutations for the shelter's staff accounts.
 *
 * The page owns the form state; this hook performs the request, reports the
 * outcome and refreshes the paginated list.
 */
export const useShelterUserMutations = ({
  onCreated,
  onUpdated,
  onDeleted,
}: UseShelterUserMutationsOptions = {}) => {
  const queryClient = useQueryClient();

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: SHELTER_USERS_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: ({ input }: CreateShelterUserVariables) => createShelterUser(input),
    onSuccess: (created, { shelterName }) => {
      toast.success(`${created.name} added. They can now access ${shelterName} only.`);
      void invalidateUsers();
      onCreated?.();
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to save user. Please try again.',
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: UpdateShelterUserVariables) =>
      updateShelterUser(id, updates),
    onSuccess: (updated) => {
      toast.success(`${updated.name} updated successfully!`);
      void invalidateUsers();
      onUpdated?.();
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to save user. Please try again.',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id }: RemoveShelterUserVariables) => removeShelterUser(id),
    onSuccess: (_result, { name }) => {
      toast.success(`${name} removed.`);
      void invalidateUsers();
      onDeleted?.();
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to remove user. Please try again.',
      );
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    /** True while the add/edit form is saving. */
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
