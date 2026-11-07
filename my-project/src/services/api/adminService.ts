import { apiRequest, apiRequestWithMeta } from '@/lib/apiClient';
import type { AdoptionApplication, Pet, Shelter } from '@/types';

import type { PaginatedResult, PetsListResponse } from './shared';

export interface ShelterSummaryRow {
  shelter: Shelter;
  petCount: number;
  publicPets: number;
  pendingApplications: number;
  staff: number;
}

/** Server-counted platform totals backing the admin overview cards. */
export interface AdminStats {
  shelters: { total: number; locations: number };
  users: { total: number; adopters: number; staff: number; admins: number };
  pets: { total: number; public: number; private: number };
  applications: {
    total: number;
    submitted: number;
    under_review: number;
    approved: number;
    rejected: number;
    adopted: number;
  };
  shelterSummaries: ShelterSummaryRow[];
  listingsByShelter: { name: string; value: number }[];
  recentApplications: AdoptionApplication[];
  recentPets: Pet[];
}

/** Single shelter with counts + assigned staff for the admin details modal. */
export interface AdminShelterDetails extends ShelterSummaryRow {
  staffList: { id: string; name: string; email: string }[];
}

export const listAdminPetsPaginated = async (options: {
  page?: number;
  limit?: number;
  search?: string;
  shelterId?: string;
} = {}): Promise<PaginatedResult<Pet>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (options.search) queryParams.set('search', options.search);
  if (options.shelterId && options.shelterId !== 'all') {
    queryParams.set('shelterId', options.shelterId);
  }

  const { data, meta } = await apiRequestWithMeta<PetsListResponse>(
    `/admin/pets?${queryParams.toString()}`,
    { auth: 'full' },
  );
  return {
    items: data.pets,
    total: meta?.total ?? data.pets.length,
    page: meta?.page ?? page,
    limit: meta?.limit ?? limit,
  };
};

/**
 * Platform-wide KPIs counted in SQL (GET /admin/stats). Dynamic only — no
 * mock fallback: counting local arrays produced wrong dashboard figures, so
 * failures throw and the UI renders an explicit error state instead.
 */
export const getAdminStats = async (): Promise<AdminStats> => {
  const data = await apiRequest<{ stats: AdminStats }>('/admin/stats', { auth: 'full' });
  return data.stats;
};

/**
 * Admin Shelters table page (GET /admin/shelters). Search, limit, and paging
 * are enforced in SQL — the table never slices a capped client list.
 */
export const listAdminSheltersPaginated = async (options: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<PaginatedResult<ShelterSummaryRow>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (options.search) queryParams.set('search', options.search);

  const { data, meta } = await apiRequestWithMeta<{ shelters: ShelterSummaryRow[] }>(
    `/admin/shelters?${queryParams.toString()}`,
    { auth: 'full' },
  );
  return {
    items: data.shelters,
    total: meta?.total ?? data.shelters.length,
    page: meta?.page ?? page,
    limit: meta?.limit ?? limit,
  };
};

export const getAdminShelter = async (id: string): Promise<AdminShelterDetails> => {
  const data = await apiRequest<{
    shelter: Shelter;
    petCount: number;
    publicPets: number;
    pendingApplications: number;
    staff: { id: string; name: string; email: string }[];
  }>(`/admin/shelters/${encodeURIComponent(id)}`, { auth: 'full' });
  return {
    shelter: data.shelter,
    petCount: data.petCount,
    publicPets: data.publicPets,
    pendingApplications: data.pendingApplications,
    staff: data.staff.length,
    staffList: data.staff,
  };
};
