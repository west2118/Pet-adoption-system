import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { ApiError } from '@/lib/apiClient';
import { shelterService } from '@/services/api';
import type { Shelter } from '@/types';

export const ADMIN_SHELTERS_QUERY_KEY = ['adminShelters'] as const;

export type CreateShelterInput = Parameters<typeof shelterService.create>[0];
export type UpdateShelterInput = Parameters<typeof shelterService.update>[1];

interface UseAdminShelterMutationsOptions {
  onCreated?: (shelter: Shelter) => void;
  onUpdated?: (shelter: Shelter | undefined) => void;
  onDeleted?: (id: string) => void;
}

export const useAdminShelterMutations = ({
  onCreated,
  onUpdated,
  onDeleted,
}: UseAdminShelterMutationsOptions = {}) => {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ADMIN_SHELTERS_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (input: CreateShelterInput) => shelterService.create(input),
    onSuccess: (created) => {
      toast.success(`${created.name} added successfully!`);
      void invalidate();
      onCreated?.(created);
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to save shelter. Please try again.',
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateShelterInput }) =>
      shelterService.update(id, input),
    onSuccess: (updated, { input }) => {
      toast.success(`${updated?.name ?? input.name ?? 'Shelter'} updated successfully!`);
      void invalidate();
      onUpdated?.(updated);
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to save shelter. Please try again.',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name?: string }) => {
      await shelterService.remove(id);
      return { id, name };
    },
    onSuccess: ({ id, name }) => {
      toast.success(name ? `${name} removed.` : 'Shelter removed.');
      void invalidate();
      onDeleted?.(id);
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to remove shelter. Please try again.',
      );
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

