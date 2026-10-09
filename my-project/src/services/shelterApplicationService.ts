import { apiRequest, apiRequestWithMeta } from '@/lib/apiClient';
import type { PaginatedResult } from '@/services/api';
import type { ShelterApplication } from '@/types';

export const listShelterApplications = async (status?: string): Promise<ShelterApplication[]> => {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const { applications } = await apiRequest<{ applications: ShelterApplication[] }>(
    `/admin/shelter-applications${query}`,
    { auth: 'full' },
  );
  return applications;
};

export const listShelterApplicationsPaginated = async (options: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
} = {}): Promise<PaginatedResult<ShelterApplication>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (options.status && options.status !== 'all') queryParams.set('status', options.status);
  if (options.search) queryParams.set('search', options.search);

  const { data, meta } = await apiRequestWithMeta<{ applications: ShelterApplication[] }>(
    `/admin/shelter-applications?${queryParams.toString()}`,
    { auth: 'full' },
  );
  return {
    items: data.applications,
    total: meta?.total ?? data.applications.length,
    page: meta?.page ?? page,
    limit: meta?.limit ?? limit,
  };
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
  listPaginated: listShelterApplicationsPaginated,
  approve: approveShelterApplication,
  reject: rejectShelterApplication,
};
