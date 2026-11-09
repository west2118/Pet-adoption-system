import { apiRequest, apiRequestWithMeta } from '@/lib/apiClient';
import type { Inquiry } from '@/types';

import type { PaginatedResult } from './shared';

interface ShelterInquiriesResponse {
  inquiries: Inquiry[];
  shelterTotal?: number;
}

export interface ShelterInquiriesPage extends PaginatedResult<Inquiry> {
  /** Unfiltered inquiry count for this shelter, used for the cap display. */
  shelterTotal: number;
}

interface InquiryResponse {
  inquiry: Inquiry;
}

export interface SubmitInquiryInput {
  petId: string;
  fromName: string;
  fromEmail: string;
  message: string;
}

/**
 * Public inquiry submit (adopter → shelter). The backend stores the row
 * against the pet, so the owning shelter sees it in its inbox.
 */
export const submitInquiry = async (input: SubmitInquiryInput): Promise<Inquiry> => {
  const data = await apiRequest<InquiryResponse>('/inquiries', {
    method: 'POST',
    body: input,
  });
  return data.inquiry;
};

export interface InquiryEmailInput {
  subject: string;
  message: string;
}

export interface InquiryEmailResult {
  inquiry: Inquiry;
  emailSent: boolean;
  emailStubbed: boolean;
}

/**
 * Send the shelter's reply to an inquiry author. The backend enforces one
 * email per inquiry and records what was sent.
 */
export const emailShelterInquiry = async (
  id: string,
  input: InquiryEmailInput,
): Promise<InquiryEmailResult> => {
  return apiRequest<InquiryEmailResult>(
    `/shelter/inquiries/${encodeURIComponent(id)}/email`,
    { method: 'POST', auth: 'full', body: input },
  );
};

/** Bulk-delete selected inquiries. The backend only removes rows for this shelter. */
export const deleteShelterInquiries = async (ids: string[]): Promise<number> => {
  const data = await apiRequest<{ deleted: number }>('/shelter/inquiries', {
    method: 'DELETE',
    auth: 'full',
    body: { ids },
  });
  return data.deleted;
};

/**
 * Shelter inbox (paginated). The backend scopes rows to the staff member's
 * shelter via the JWT; no shelter id is sent from the client.
 */
export const listShelterInquiriesPaginated = async (options: {
  page?: number;
  limit?: number;
  resolved?: boolean;
  search?: string;
} = {}): Promise<ShelterInquiriesPage> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (options.resolved !== undefined) queryParams.set('resolved', String(options.resolved));
  if (options.search) queryParams.set('search', options.search);

  const { data, meta } = await apiRequestWithMeta<ShelterInquiriesResponse>(
    `/shelter/inquiries?${queryParams.toString()}`,
    { auth: 'full' },
  );
  return {
    items: data.inquiries,
    total: meta?.total ?? data.inquiries.length,
    page: meta?.page ?? page,
    limit: meta?.limit ?? limit,
    shelterTotal: data.shelterTotal ?? meta?.total ?? data.inquiries.length,
  };
};
