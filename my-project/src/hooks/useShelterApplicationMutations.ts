import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { ApiError } from '@/lib/apiClient';
import { adoptionApplicationService } from '@/services/adoptionApplicationService';
import type { AdoptionApplication, ApplicationStatus } from '@/types';

export const SHELTER_APPLICATIONS_QUERY_KEY = ['shelterApplications'] as const;

export interface UpdateApplicationStatusVariables {
  id: string;
  status: ApplicationStatus;
  note?: string;
  pickup?: { pickupAt: string; pickupEmail: string };
}

/**
 * Status mutations for the shelter's adoption applications.
 *
 * The API call, success/error toasts and cache invalidation live here so the
 * page only runs its decision/waiver flow around the outcome.
 */
export const useShelterApplicationMutations = () => {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      note,
      pickup,
    }: UpdateApplicationStatusVariables) =>
      adoptionApplicationService.updateStatus(
        id,
        status,
        note ?? 'Updated by staff',
        pickup,
      ),
    onSuccess: (updated: AdoptionApplication) => {
      toast.success(`Application ${updated.status.toLowerCase()}!`);
      void queryClient.invalidateQueries({ queryKey: SHELTER_APPLICATIONS_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError
          ? err.message
          : 'Failed to update application status. Please try again.',
      );
    },
  });

  return {
    updateStatusMutation,
    /** True while a decision is being saved. */
    isUpdating: updateStatusMutation.isPending,
  };
};
