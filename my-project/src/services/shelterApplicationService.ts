import { apiRequest } from '@/lib/apiClient';
import type { ShelterApplication } from '@/types';

export const listShelterApplications = async (status?: string): Promise<ShelterApplication[]> => {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const { applications } = await apiRequest<{ applications: ShelterApplication[] }>(
    `/admin/shelter-applications${query}`,
    { auth: 'full' },
  );
  return applications;
};

export const approveShelterApplication = async (id: string): Promise<void> => {
  await apiRequest(`/admin/shelter-applications/${id}/approve`, {
    method: 'PATCH',
    auth: 'full',
  });
};

export const rejectShelterApplication = async (id: string, reviewNote?: string): Promise<void> => {
  await apiRequest(`/admin/shelter-applications/${id}/reject`, {
    method: 'PATCH',
    auth: 'full',
    body: { reviewNote },
  });
};

export const shelterApplicationService = {
  list: listShelterApplications,
  approve: approveShelterApplication,
  reject: rejectShelterApplication,
};
