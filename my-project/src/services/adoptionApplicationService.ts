import { apiRequest, apiRequestWithMeta } from '@/lib/apiClient';
import type { PaginatedResult } from '@/services/api';
import type { AdoptionApplication, ApplicationStatus } from '@/types';

export interface CreateAdoptionApplicationInput {
  petId: string;
  applicantName: string;
  email: string;
  phone: string;
  address: string;
  housingType: 'house' | 'apartment' | 'condo' | 'other';
  hasOtherPets: boolean;
  experience: string;
  reason: string;
}

/**
 * Dynamic adoption-application API backed by the Express backend.
 *
 * - Adopter: POST /applications, GET /applications/my
 * - Shelter: GET /shelter/applications, PATCH /shelter/applications/:id/status
 *
 * Both sides read the same Postgres rows, so a submission from
 * AdoptionFormPage shows up in the shelter applications table and in the
 * adopter's own Applications page.
 */
export const createAdoptionApplication = async (
  input: CreateAdoptionApplicationInput,
): Promise<AdoptionApplication> => {
  const { application } = await apiRequest<{ application: AdoptionApplication }>(
    '/applications',
    { method: 'POST', body: input, auth: 'full' },
  );
  return application;
};

export const getMyApplicationForPet = async (
  petId: string,
): Promise<AdoptionApplication | null> => {
  const { application } = await apiRequest<{ application: AdoptionApplication | null }>(
    `/applications/my/pet/${encodeURIComponent(petId)}`,
    { auth: 'full' },
  );
  return application;
};

export const listMyApplications = async (): Promise<AdoptionApplication[]> => {
  // Callers that want the whole list (profile summaries) opt in explicitly —
  // the default page size for GET /applications/my is 5.
  const { applications } = await apiRequest<{ applications: AdoptionApplication[] }>(
    '/applications/my?limit=100',
    { auth: 'full' },
  );
  return applications;
};

/** Backend default page size for GET /applications/my. */
const MY_APPLICATIONS_PAGE_SIZE = 5;

export interface ApplicationSummary {
  total: number;
  underReview: number;
  approved: number;
  adopted: number;
}

/**
 * One page of the adopter's applications ("My applications").
 *
 * No `limit` is sent — the backend's default for this endpoint is **5** and
 * it answers with `meta { page, limit, total, totalPages }`.
 */
export const listMyApplicationsPaginated = async (
  options: { page?: number } = {},
): Promise<PaginatedResult<AdoptionApplication>> => {
  const page = options.page ?? 1;
  const { data, meta } = await apiRequestWithMeta<{ applications: AdoptionApplication[] }>(
    `/applications/my?page=${page}`,
    { auth: 'full' },
  );
  const limit = meta?.limit ?? MY_APPLICATIONS_PAGE_SIZE;
  const total = meta?.total ?? data.applications.length;
  return {
    items: data.applications,
    total,
    page: meta?.page ?? page,
    limit,
    totalPages: meta?.totalPages ?? Math.ceil(total / limit),
  };
};

/**
 * Status counters across ALL of an adopter's applications — keeps the summary
 * bar correct while the list itself is paged.
 */
export const getMyApplicationSummary = async (): Promise<ApplicationSummary> => {
  const { summary } = await apiRequest<{ summary: ApplicationSummary }>(
    '/applications/my/stats',
    { auth: 'full' },
  );
  return summary;
};

export const listShelterApplications = async (
  status?: string,
): Promise<AdoptionApplication[]> => {
  const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
  const { applications } = await apiRequest<{ applications: AdoptionApplication[] }>(
    `/shelter/applications${query}`,
    { auth: 'full' },
  );
  return applications;
};

export const listShelterApplicationsPaginated = async (options: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
} = {}): Promise<PaginatedResult<AdoptionApplication>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (options.status && options.status !== 'all') queryParams.set('status', options.status);
  if (options.search) queryParams.set('search', options.search);

  const { data, meta } = await apiRequestWithMeta<{ applications: AdoptionApplication[] }>(
    `/shelter/applications?${queryParams.toString()}`,
    { auth: 'full' },
  );
  return {
    items: data.applications,
    total: meta?.total ?? data.applications.length,
    page: meta?.page ?? page,
    limit: meta?.limit ?? limit,
  };
};

export const cancelMyApplication = async (
  id: string,
  reason?: string,
): Promise<AdoptionApplication> => {
  const { application } = await apiRequest<{ application: AdoptionApplication }>(
    `/applications/${encodeURIComponent(id)}/cancel`,
    { method: 'PATCH', body: { reason }, auth: 'full' },
  );
  return application;
};

/**
 * Shelter decision. Approving also schedules the clinic pickup, so both
 * `pickupAt` (ISO timestamp) and `pickupEmail` are required for `Approved`.
 */
export const updateShelterApplicationStatus = async (
  id: string,
  status: ApplicationStatus,
  note?: string,
  pickup?: { pickupAt?: string | null; pickupEmail?: string | null },
): Promise<AdoptionApplication> => {
  const { application } = await apiRequest<{ application: AdoptionApplication }>(
    `/shelter/applications/${id}/status`,
    {
      method: 'PATCH',
      body: {
        status,
        note: note ?? null,
        pickupAt: pickup?.pickupAt ?? null,
        pickupEmail: pickup?.pickupEmail ?? null,
      },
      auth: 'full',
    },
  );
  return application;
};

export const adoptionApplicationService = {
  create: createAdoptionApplication,
  getByPet: getMyApplicationForPet,
  listMine: listMyApplications,
  listMinePaginated: listMyApplicationsPaginated,
  summaryMine: getMyApplicationSummary,
  cancelMine: cancelMyApplication,
  listForShelter: listShelterApplications,
  listForShelterPaginated: listShelterApplicationsPaginated,
  updateStatus: updateShelterApplicationStatus,
};
