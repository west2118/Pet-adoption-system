import { apiRequest, apiRequestWithMeta } from '@/lib/apiClient';
import type { PaginatedResult } from '@/services/api';
import type { VisitStatus, VisitThread } from '@/types';

/**
 * Visit requests (meet-and-greet coordination). There is no conversation:
 * the shelter approves or declines and the adopter is emailed the decision.
 * Dynamic only — every call hits the API; failures throw for explicit error
 * states.
 */

export interface RequestVisitInput {
  petId: string;
  preferredSlot: string;
}

export interface VisitSummary {
  total: number;
  requested: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export const getMyVisitSummary = async (): Promise<VisitSummary> => {
  const data = await apiRequest<{ summary: VisitSummary }>('/visits/my/stats', {
    auth: 'full',
  });
  return data.summary;
};

export const requestVisit = async (input: RequestVisitInput): Promise<VisitThread> => {
  const data = await apiRequest<{ thread: VisitThread }>('/visits', {
    method: 'POST',
    body: input,
    auth: 'full',
  });
  return data.thread;
};

export const getMyVisitForPet = async (petId: string): Promise<VisitThread | null> => {
  const data = await apiRequest<{ visit: VisitThread | null }>(
    `/visits/my/pet/${encodeURIComponent(petId)}`,
    { auth: 'full' },
  );
  return data.visit;
};

export const listMyVisits = async (options: {
  page?: number;
  limit?: number;
  status?: string;
} = {}): Promise<PaginatedResult<VisitThread>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (options.status && options.status !== 'all') queryParams.set('status', options.status);

  const { data, meta } = await apiRequestWithMeta<{ threads: VisitThread[] }>(
    `/visits/my?${queryParams.toString()}`,
    { auth: 'full' },
  );
  return {
    items: data.threads,
    total: meta?.total ?? data.threads.length,
    page: meta?.page ?? page,
    limit: meta?.limit ?? limit,
  };
};

export const cancelMyVisit = async (id: string, cancelReason?: string): Promise<VisitThread> => {
  const data = await apiRequest<{ thread: VisitThread }>(
    `/visits/${encodeURIComponent(id)}/cancel`,
    { method: 'PATCH', body: { cancelReason }, auth: 'full' },
  );
  return data.thread;
};

export const listShelterVisits = async (options: {
  page?: number;
  limit?: number;
  status?: string;
} = {}): Promise<PaginatedResult<VisitThread>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (options.status && options.status !== 'all') queryParams.set('status', options.status);

  const { data, meta } = await apiRequestWithMeta<{ threads: VisitThread[] }>(
    `/shelter/visits?${queryParams.toString()}`,
    { auth: 'full' },
  );
  return {
    items: data.threads,
    total: meta?.total ?? data.threads.length,
    page: meta?.page ?? page,
    limit: meta?.limit ?? limit,
  };
};

export const getShelterVisit = async (id: string): Promise<VisitThread> => {
  const data = await apiRequest<{ thread: VisitThread }>(
    `/shelter/visits/${encodeURIComponent(id)}`,
    { auth: 'full' },
  );
  return data.thread;
};

export const updateShelterVisitStatus = async (
  id: string,
  input: {
    status: VisitStatus;
    confirmedSlot?: string;
    cancelReason?: string;
    /** Emailed with the confirmation (date + short message). */
    message?: string;
  },
): Promise<VisitThread> => {
  const data = await apiRequest<{ thread: VisitThread }>(
    `/shelter/visits/${encodeURIComponent(id)}/status`,
    { method: 'PATCH', body: input, auth: 'full' },
  );
  return data.thread;
};

export const visitService = {
  request: requestVisit,
  getMineForPet: getMyVisitForPet,
  listMine: listMyVisits,
  cancelMine: cancelMyVisit,
  listForShelter: listShelterVisits,
  getForShelter: getShelterVisit,
  updateStatus: updateShelterVisitStatus,
};
