import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { ApiError } from '@/lib/apiClient';
import { petService } from '@/services/api';
import type { Pet } from '@/types';

/** Payload accepted when creating a listing. */
export type PetListingInput = Parameters<typeof petService.create>[0];

/** Partial update accepted when saving an existing listing. */
export type PetListingUpdates = Parameters<typeof petService.update>[1];

interface DeleteListingVariables {
  id: string;
  /** Shown in the success toast; falls back to a generic message. */
  name?: string;
}

interface BulkDeleteListingsVariables {
  ids: string[];
  /** Human-readable summary of the selected listings, used in the toast. */
  description?: string;
}

interface UseShelterListingMutationsOptions {
  /** Runs after a listing is created, e.g. to close the form modal. */
  onCreated?: (pet: Pet) => void;
  /** Runs after a listing is updated, e.g. to close the form modal. */
  onUpdated?: (pet: Pet | undefined) => void;
  /** Runs after a listing is deleted, e.g. to close the confirm modal. */
  onDeleted?: (petId: string) => void;
  /** Runs after a bulk delete succeeds, e.g. to close the confirm modal. */
  onBulkDeleted?: () => void;
}

const LISTINGS_QUERY_KEY = ['shelterListings'] as const;

/**
 * Create, update and delete mutations for the shelter's pet listings.
 *
 * API calls, success toasts and cache invalidation live here so the page only
 * reacts to the outcome (closing modals, resetting local state).
 */
export const useShelterListingMutations = ({
  onCreated,
  onUpdated,
  onDeleted,
  onBulkDeleted,
}: UseShelterListingMutationsOptions = {}) => {
  const queryClient = useQueryClient();

  const invalidateListings = () =>
    queryClient.invalidateQueries({ queryKey: LISTINGS_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (payload: PetListingInput) => petService.create(payload),
    onSuccess: (createdPet) => {
      toast.success(`${createdPet.name} created successfully!`);
      void invalidateListings();
      onCreated?.(createdPet);
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to create listing. Please try again.',
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PetListingUpdates }) =>
      petService.update(id, updates),
    onSuccess: (updatedPet) => {
      toast.success(`${updatedPet?.name || 'Pet'} updated successfully!`);
      void invalidateListings();
      onUpdated?.(updatedPet);
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to update listing. Please try again.',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id }: DeleteListingVariables) => petService.remove(id),
    onSuccess: (_result, { id, name }) => {
      toast.success(name ? `${name} removed.` : 'Listing removed.');
      void invalidateListings();
      onDeleted?.(id);
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to remove listing. Please try again.',
      );
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: ({ ids }: BulkDeleteListingsVariables) => petService.removeMany(ids),
    onSuccess: (deleted, { description }) => {
      toast.success(
        description
          ? `${description} removed.`
          : deleted === 1
            ? 'Listing removed.'
            : `${deleted} listings removed.`,
      );
      void invalidateListings();
      onBulkDeleted?.();
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to remove listings. Please try again.',
      );
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    bulkDeleteMutation,
    /** True while the add/edit form is saving. */
    isSaving: createMutation.isPending || updateMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
  };
};
