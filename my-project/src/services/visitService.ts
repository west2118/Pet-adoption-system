import { apiRequest, apiRequestWithMeta } from '@/lib/apiClient';
import type { PaginatedResult } from '@/services/api';
import type { VisitMessage, VisitStatus, VisitThread } from '@/types';

/**
 * Visit scheduling threads (meet-and-greet coordination). Dynamic only —
 * every call hits the API; failures throw for explicit error states.
 */

export interface RequestVisitInput {
  petId: string;
  preferredSlot: string;
  message: string;
}

export interface VisitSummary {
  total: number;
  requested: number;
  proposed: number;
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

export const requestVisit = async (
  input: RequestVisitInput,
): Promise<{ thread: VisitThread; messages: VisitMessage[] }> => {
  const data = await apiRequest<{ thread: VisitThread; messages: VisitMessage[] }>(
    '/visits',
    { method: 'POST', body: input, auth: 'full' },
  );
  return data;
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

export const getMyVisit = async (
  id: string,
): Promise<{ thread: VisitThread; messages: VisitMessage[] }> =>
  apiRequest(`/visits/${encodeURIComponent(id)}`, { auth: 'full' });

export const postMyVisitMessage = async (id: string, body: string): Promise<VisitMessage> => {
  const data = await apiRequest<{ message: VisitMessage }>(
    `/visits/${encodeURIComponent(id)}/messages`,
    { method: 'POST', body: { body }, auth: 'full' },
  );
  return data.message;
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

export const getShelterVisit = async (
  id: string,
): Promise<{ thread: VisitThread; messages: VisitMessage[] }> =>
  apiRequest(`/shelter/visits/${encodeURIComponent(id)}`, { auth: 'full' });

export const postShelterVisitMessage = async (
  id: string,
  body: string,
): Promise<VisitMessage> => {
  const data = await apiRequest<{ message: VisitMessage }>(
    `/shelter/visits/${encodeURIComponent(id)}/messages`,
    { method: 'POST', body: { body }, auth: 'full' },
  );
  return data.message;
};

export const updateShelterVisitStatus = async (
  id: string,
  input: { status: VisitStatus; confirmedSlot?: string; cancelReason?: string },
): Promise<VisitThread> => {
  const data = await apiRequest<{ thread: VisitThread }>(
    `/shelter/visits/${encodeURIComponent(id)}/status`,
    { method: 'PATCH', body: input, auth: 'full' },
  );
  return data.thread;
};

export const visitService = {
  request: requestVisit,
  listMine: listMyVisits,
  getMine: getMyVisit,
  postMyMessage: postMyVisitMessage,
  cancelMine: cancelMyVisit,
  listForShelter: listShelterVisits,
  getForShelter: getShelterVisit,
  postShelterMessage: postShelterVisitMessage,
  updateStatus: updateShelterVisitStatus,
};
