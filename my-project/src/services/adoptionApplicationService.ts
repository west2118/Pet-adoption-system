import { ApiError, apiRequest, apiRequestWithMeta, sessionStore } from '@/lib/apiClient';
import { mockApplications } from '@/data/mockData';
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

export const listMyApplications = async (): Promise<AdoptionApplication[]> => {
  // Callers that want the whole list (profile summaries) opt in explicitly —
  // the default page size for GET /applications/my is now 5.
  const { applications } = await apiRequest<{ applications: AdoptionApplication[] }>(
    '/applications/my?limit=100',
    { auth: 'full' },
  );
  return applications;
};

/** Mirrors the backend's default page size for GET /applications/my (demo fallback only). */
const MY_APPLICATIONS_PAGE_SIZE = 5;

export interface ApplicationSummary {
  total: number;
  underReview: number;
  approved: number;
  adopted: number;
}

const shouldFallbackToMocks = (err: unknown): boolean =>
  err instanceof ApiError && (err.status === 0 || err.status === 401 || err.status === 403);

const mockRowsFor = (applicantId?: string): AdoptionApplication[] =>
  mockApplications.filter((a) => !applicantId || a.applicantId === applicantId);

/**
 * One page of the adopter's applications ("My applications").
 *
 * No `limit` is sent — the backend's default for this endpoint is **5** and
 * it answers with `meta { page, limit, total, totalPages }`.
 * `applicantId` is only used by the in-memory demo fallback.
 */
export const listMyApplicationsPaginated = async (
  options: { page?: number; applicantId?: string } = {},
): Promise<PaginatedResult<AdoptionApplication>> => {
  const page = options.page ?? 1;
  if (sessionStore.has()) {
    try {
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
    } catch (err) {
      if (!shouldFallbackToMocks(err)) throw err;
    }
  }

  const rows = mockRowsFor(options.applicantId);
  const start = (page - 1) * MY_APPLICATIONS_PAGE_SIZE;
  return {
    items: rows.slice(start, start + MY_APPLICATIONS_PAGE_SIZE),
    total: rows.length,
    page,
    limit: MY_APPLICATIONS_PAGE_SIZE,
    totalPages: Math.ceil(rows.length / MY_APPLICATIONS_PAGE_SIZE),
  };
};

/**
 * Status counters across ALL of an adopter's applications — keeps the summary
 * bar correct while the list itself is paged.
 */
export const getMyApplicationSummary = async (
  applicantId?: string,
): Promise<ApplicationSummary> => {
  if (sessionStore.has()) {
    try {
      const { summary } = await apiRequest<{ summary: ApplicationSummary }>(
        '/applications/my/stats',
        { auth: 'full' },
      );
      return summary;
    } catch (err) {
      if (!shouldFallbackToMocks(err)) throw err;
    }
  }

  const rows = mockRowsFor(applicantId);
  return {
    total: rows.length,
    underReview: rows.filter((a) => a.status === 'Under Review').length,
    approved: rows.filter((a) => a.status === 'Approved').length,
    adopted: rows.filter((a) => a.status === 'Adopted').length,
  };
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

export const updateShelterApplicationStatus = async (
  id: string,
  status: ApplicationStatus,
  note?: string,
): Promise<AdoptionApplication> => {
  const { application } = await apiRequest<{ application: AdoptionApplication }>(
    `/shelter/applications/${id}/status`,
    { method: 'PATCH', body: { status, note: note ?? null }, auth: 'full' },
  );
  return application;
};

export const adoptionApplicationService = {
  create: createAdoptionApplication,
  listMine: listMyApplications,
  listMinePaginated: listMyApplicationsPaginated,
  summaryMine: getMyApplicationSummary,
  listForShelter: listShelterApplications,
  listForShelterPaginated: listShelterApplicationsPaginated,
  updateStatus: updateShelterApplicationStatus,
};
