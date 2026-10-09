import { apiRequest } from '@/lib/apiClient';
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
  updateStatus: updateShelterApplicationStatus,
};
