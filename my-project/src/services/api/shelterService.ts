import { apiRequest, apiRequestWithMeta } from '@/lib/apiClient';
import type { Shelter } from '@/types';

import { PUBLIC_PAGE_LIMIT, isNotFoundError } from './shared';
import type { PaginatedResult, ShelterResponse, SheltersListResponse } from './shared';

export interface ShelterStats {
  /** Partner rescues across the whole network. */
  total: number;
  cities: number;
  /** Every pet in the shelters' care, not just public listings. */
  petsInCare: number;
}

/** Backend default page size for GET /shelters, used only if `meta` is absent. */
const SHELTER_PAGE_SIZE = 10;

export const listShelters = async (): Promise<Shelter[]> => {
  const data = await apiRequest<SheltersListResponse>(`/shelters?limit=${PUBLIC_PAGE_LIMIT}`);
  return data.shelters;
};

/** A 404 means "no such shelter"; other failures propagate to the caller. */
export const getShelterById = async (id: string): Promise<Shelter | undefined> => {
  try {
    const data = await apiRequest<ShelterResponse>(`/shelters/${encodeURIComponent(id)}`);
    return data.shelter;
  } catch (err) {
    if (isNotFoundError(err)) return undefined;
    throw err;
  }
};

/**
 * One page of the public shelter directory.
 *
 * No `limit` is sent — the backend applies its own default (10) and answers
 * with `meta { page, limit, total, totalPages }`.
 */
export const listSheltersPaginated = async (
  options: { page?: number } = {},
): Promise<PaginatedResult<Shelter>> => {
  const page = options.page ?? 1;
  const { data, meta } = await apiRequestWithMeta<SheltersListResponse>(`/shelters?page=${page}`);
  const limit = meta?.limit ?? SHELTER_PAGE_SIZE;
  const total = meta?.total ?? data.shelters.length;
  return {
    items: data.shelters,
    total,
    page: meta?.page ?? page,
    limit,
    totalPages: meta?.totalPages ?? Math.ceil(total / limit),
  };
};

/** Network-wide header numbers — fetched apart from the paged directory. */
export const getShelterStats = async (): Promise<ShelterStats> => {
  const data = await apiRequest<{ stats: ShelterStats }>('/shelters/stats');
  return data.stats;
};

export const createShelter = async (
  input: Omit<Shelter, 'id' | 'totalPets'>,
): Promise<Shelter> => {
  const { shelter } = await apiRequest<{ shelter: Shelter }>('/shelters', {
    method: 'POST',
    body: input,
    auth: 'full',
  });
  return shelter;
};

export const updateShelter = async (
  id: string,
  patch: Partial<Shelter>,
): Promise<Shelter> => {
  const { shelter } = await apiRequest<{ shelter: Shelter }>(
    `/shelters/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: patch, auth: 'full' },
  );
  return shelter;
};

export const removeShelter = async (id: string): Promise<void> => {
  await apiRequest(`/shelters/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: 'full',
  });
};

export const shelterService = {
  list: listShelters,
  getById: getShelterById,
  create: createShelter,
  update: updateShelter,
  remove: removeShelter,
};
