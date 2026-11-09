import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { ApiError } from '@/lib/apiClient';
import { shelterApplicationService } from '@/services/shelterApplicationService';
import type { ReviewEmailStatus } from '@/services/shelterApplicationService';

export const PLATFORM_SHELTER_APPLICATIONS_QUERY_KEY = ['platformShelterApplications'] as const;

interface UsePlatformShelterApplicationMutationsOptions {
  onApproved?: () => void;
  onRejected?: () => void;
}

export const usePlatformShelterApplicationMutations = ({
  onApproved,
  onRejected,
}: UsePlatformShelterApplicationMutationsOptions = {}) => {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: PLATFORM_SHELTER_APPLICATIONS_QUERY_KEY });

  const notifyEmailStatus = (appName: string, action: 'approved' | 'rejected', status: ReviewEmailStatus) => {
    if (status.emailSent) {
      toast.success(`${appName} ${action}! Notification email sent.`);
    } else if (status.emailStubbed) {
      toast.warning(`${appName} ${action}, but no email was delivered (email service not configured).`);
    } else {
      toast.warning(`${appName} ${action}, but the notification email failed to send.`);
    }
  };

  const approveMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message?: string; name: string }) =>
      shelterApplicationService.approve(id, message),
    onSuccess: (status, { name }) => {
      notifyEmailStatus(name, 'approved', status);
      void invalidate();
      onApproved?.();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to approve application.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reviewNote }: { id: string; reviewNote?: string; name: string }) =>
      shelterApplicationService.reject(id, reviewNote),
    onSuccess: (status, { name }) => {
      notifyEmailStatus(name, 'rejected', status);
      void invalidate();
      onRejected?.();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to reject application.');
    },
  });

  const resendEmailMutation = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      shelterApplicationService.resendEmail(id),
    onSuccess: ({ emailSent, emailStubbed }) => {
      if (emailSent) {
        toast.success('Notification email sent!');
      } else if (emailStubbed) {
        toast.warning('Email service is not configured (notification was stubbed).');
      } else {
        toast.warning('Email could not be delivered.');
      }
      void invalidate();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to resend email.');
    },
  });

  return {
    approveMutation,
    rejectMutation,
    resendEmailMutation,
    isWorking:
      approveMutation.isPending ||
      rejectMutation.isPending ||
      resendEmailMutation.isPending,
  };
};

