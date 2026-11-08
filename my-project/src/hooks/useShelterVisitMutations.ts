import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { ApiError } from '@/lib/apiClient';
import { visitService } from '@/services/visitService';

interface ApproveVisitVariables {
  id: string;
  /** Visit date and time emailed to the adopter. */
  slot: string;
  message?: string;
  /** True when the visit was already confirmed and this is a reschedule. */
  isReschedule: boolean;
  petName?: string;
  adopterEmail?: string | null;
}

interface DeclineVisitVariables {
  id: string;
  reason?: string;
  petName?: string;
}

interface CompleteVisitVariables {
  id: string;
  petName?: string;
}

interface UseShelterVisitMutationsOptions {
  /** Runs after any status change, e.g. to close the open dialog. */
  onUpdated?: () => void;
}

export const SHELTER_VISITS_QUERY_KEY = ['shelterVisits'] as const;
const VISIT_DETAILS_QUERY_KEY = ['shelterVisit'] as const;

/**
 * Approve/decline/complete mutations for shelter visit requests.
 *
 * Each decision invalidates both the visit list and any open detail query, so
 * the tables and the details modal always show the stored status.
 */
export const useShelterVisitMutations = ({
  onUpdated,
}: UseShelterVisitMutationsOptions = {}) => {
  const queryClient = useQueryClient();

  const invalidateVisits = () => {
    void queryClient.invalidateQueries({ queryKey: SHELTER_VISITS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: VISIT_DETAILS_QUERY_KEY });
  };

  const approveMutation = useMutation({
    mutationFn: ({ id, slot, message }: ApproveVisitVariables) =>
      visitService.updateStatus(id, {
        status: 'confirmed',
        confirmedSlot: slot,
        message,
      }),
    onSuccess: (_thread, { isReschedule, petName, adopterEmail }) => {
      const who = adopterEmail ?? 'the adopter';
      toast.success(
        isReschedule
          ? `Updated visit for ${petName ?? 'the pet'} emailed to ${who}.`
          : `Visit for ${petName ?? 'the pet'} approved — emailed to ${who}.`,
      );
      invalidateVisits();
      onUpdated?.();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to send the visit email.');
    },
  });

  const declineMutation = useMutation({
    mutationFn: ({ id, reason }: DeclineVisitVariables) =>
      visitService.updateStatus(id, { status: 'cancelled', cancelReason: reason }),
    onSuccess: (_thread, { petName }) => {
      toast.success(`${petName ?? 'Visit'} declined — the adopter has been emailed.`);
      invalidateVisits();
      onUpdated?.();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update visit.');
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id }: CompleteVisitVariables) =>
      visitService.updateStatus(id, { status: 'completed' }),
    onSuccess: () => {
      toast.success('Visit marked completed.');
      invalidateVisits();
      onUpdated?.();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update visit.');
    },
  });

  return {
    approveMutation,
    declineMutation,
    completeMutation,
    /** True while any visit decision is being saved. */
    isWorking:
      approveMutation.isPending || declineMutation.isPending || completeMutation.isPending,
  };
};
