import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { ApiError } from '@/lib/apiClient';
import { waiverService } from '@/services/waiverService';
import type { WaiverTemplateInput } from '@/services/waiverService';
import type { WaiverTemplate } from '@/types';

interface UpdateWaiverTemplateVariables {
  id: string;
  updates: Partial<WaiverTemplateInput>;
}

interface DeleteWaiverTemplateVariables {
  id: string;
  name: string;
}

interface UseShelterWaiverMutationsOptions {
  onCreated?: (template: WaiverTemplate) => void;
  onUpdated?: (template: WaiverTemplate) => void;
  onDeleted?: (id: string) => void;
}

export const SHELTER_WAIVER_TEMPLATES_QUERY_KEY = ['shelterWaiverTemplates'] as const;

/**
 * Create/update/delete mutations for the shelter's waiver templates.
 *
 * Requests, toasts and cache invalidation live here, so the page only closes
 * its editor and clears local selection state on success.
 */
export const useShelterWaiverMutations = ({
  onCreated,
  onUpdated,
  onDeleted,
}: UseShelterWaiverMutationsOptions = {}) => {
  const queryClient = useQueryClient();

  const invalidateTemplates = () =>
    queryClient.invalidateQueries({ queryKey: SHELTER_WAIVER_TEMPLATES_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (input: WaiverTemplateInput) => waiverService.createTemplate(input),
    onSuccess: (created) => {
      toast.success(`"${created.name}" created successfully!`);
      void invalidateTemplates();
      onCreated?.(created);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save template.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: UpdateWaiverTemplateVariables) =>
      waiverService.updateTemplate(id, updates),
    onSuccess: (updated) => {
      toast.success(`"${updated.name}" updated successfully!`);
      void invalidateTemplates();
      onUpdated?.(updated);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save template.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id }: DeleteWaiverTemplateVariables) =>
      waiverService.deleteTemplate(id),
    onSuccess: (_result, { id, name }) => {
      toast.success(`"${name}" deleted.`);
      void invalidateTemplates();
      onDeleted?.(id);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete template.');
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    /** True while the template editor is saving. */
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
