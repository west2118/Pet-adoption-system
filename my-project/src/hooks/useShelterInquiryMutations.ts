import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { ApiError } from '@/lib/apiClient';
import { deleteShelterInquiries, emailShelterInquiry } from '@/services/api';

interface DeleteInquiriesVariables {
  ids: string[];
  /** Human-readable summary of the selected inquiries, used in the toast. */
  description?: string;
}

interface SendInquiryEmailVariables {
  id: string;
  /** Shown in the success toast so staff know who was answered. */
  fromEmail: string;
  subject: string;
  message: string;
}

interface UseShelterInquiryMutationsOptions {
  /** Runs after the reply is delivered, e.g. to close the compose panel. */
  onEmailed?: () => void;
  /** Runs when the inquiry already has an email on record. */
  onConflict?: () => void;
  /** Runs after a bulk delete succeeds, e.g. to close the confirmation modal. */
  onDeleted?: () => void;
}

export const SHELTER_INQUIRIES_QUERY_KEY = ['shelterInquiries'] as const;

/**
 * Reply-to-inquirer mutation for the shelter inbox.
 *
 * The API call, toast and cache invalidation live here so the page only
 * reacts to the outcome (closing the compose panel).
 */
export const useShelterInquiryMutations = ({
  onEmailed,
  onConflict,
  onDeleted,
}: UseShelterInquiryMutationsOptions = {}) => {
  const queryClient = useQueryClient();

  const invalidateInquiries = () =>
    queryClient.invalidateQueries({ queryKey: SHELTER_INQUIRIES_QUERY_KEY });

  const emailMutation = useMutation({
    mutationFn: ({ id, subject, message }: SendInquiryEmailVariables) =>
      emailShelterInquiry(id, { subject, message }),
    onSuccess: (result, { fromEmail }) => {
      if (result.emailSent) {
        toast.success(`Email sent to ${fromEmail}.`);
        void invalidateInquiries();
        onEmailed?.();
        return;
      }
      if (result.emailStubbed) {
        toast.warning(
          'Email is not configured yet. Add your Gmail SMTP credentials to backend/.env.',
        );
        return;
      }
      toast.error('Email could not be sent. Please try again.');
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        toast.info('An email has already been sent for this inquiry.');
        void invalidateInquiries();
        onConflict?.();
        return;
      }
      toast.error(err instanceof ApiError ? err.message : 'Failed to send email.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ ids }: DeleteInquiriesVariables) => deleteShelterInquiries(ids),
    onSuccess: (deleted, { description }) => {
      toast.success(
        description
          ? `${description} deleted.`
          : deleted === 1
            ? 'Inquiry deleted.'
            : `${deleted} inquiries deleted.`,
      );
      void invalidateInquiries();
      onDeleted?.();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete inquiries.');
    },
  });

  return {
    emailMutation,
    deleteMutation,
    isSending: emailMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
