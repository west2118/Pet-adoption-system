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

export const listMyApplications = async (): Promise<AdoptionApplication[]> => {
  const { applications } = await apiRequest<{ applications: AdoptionApplication[] }>(
    '/applications/my',
    { auth: 'full' },
  );
  return applications;
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
  listForShelter: listShelterApplications,
  listForShelterPaginated: listShelterApplicationsPaginated,
  updateStatus: updateShelterApplicationStatus,
};
