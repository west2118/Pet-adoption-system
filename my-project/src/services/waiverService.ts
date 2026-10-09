import { apiRequest, apiRequestWithMeta } from '@/lib/apiClient';
import type { PaginatedResult } from '@/services/api';
import type { Waiver, WaiverTemplate, WaiverTemplateStatus } from '@/types';

export interface WaiverTemplateInput {
  name: string;
  category: string;
  body: string;
  status: WaiverTemplateStatus;
}

/**
 * Dynamic e-waiver API backed by the Express backend.
 *
 * - Shelter: GET/POST /shelter/waiver-templates, PATCH /shelter/waiver-templates/:id,
 *   POST /shelter/applications/:id/waiver, GET /shelter/waivers/:id
 * - Adopter: GET /applications/:id/waiver (own applications only)
 */
export const listWaiverTemplates = async (): Promise<WaiverTemplate[]> => {
  const { templates } = await apiRequest<{ templates: WaiverTemplate[] }>(
    '/shelter/waiver-templates',
    { auth: 'full' },
  );
  return templates;
};

export const listWaiverTemplatesPaginated = async (options: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
} = {}): Promise<PaginatedResult<WaiverTemplate>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (options.category && options.category !== 'all') queryParams.set('category', options.category);
  if (options.search) queryParams.set('search', options.search);

  const { data, meta } = await apiRequestWithMeta<{ templates: WaiverTemplate[] }>(
    `/shelter/waiver-templates?${queryParams.toString()}`,
    { auth: 'full' },
  );
  return {
    items: data.templates,
    total: meta?.total ?? data.templates.length,
    page: meta?.page ?? page,
    limit: meta?.limit ?? limit,
  };
};

export const createWaiverTemplate = async (
  input: WaiverTemplateInput,
): Promise<WaiverTemplate> => {
  const { template } = await apiRequest<{ template: WaiverTemplate }>(
    '/shelter/waiver-templates',
    { method: 'POST', body: input, auth: 'full' },
  );
  return template;
};

export const updateWaiverTemplate = async (
  id: string,
  patch: Partial<WaiverTemplateInput>,
): Promise<WaiverTemplate> => {
  const { template } = await apiRequest<{ template: WaiverTemplate }>(
    `/shelter/waiver-templates/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: patch, auth: 'full' },
  );
  return template;
};

export const generateApplicationWaiver = async (
  applicationId: string,
  templateIds: string[],
): Promise<Waiver> => {
  const { waiver } = await apiRequest<{ waiver: Waiver }>(
    `/shelter/applications/${encodeURIComponent(applicationId)}/waiver`,
    { method: 'POST', body: { templateIds }, auth: 'full' },
  );
  return waiver;
};

export const getApplicationWaiver = async (applicationId: string): Promise<Waiver> => {
  const { waiver } = await apiRequest<{ waiver: Waiver }>(
    `/shelter/applications/${encodeURIComponent(applicationId)}/waiver`,
    { auth: 'full' },
  );
  return waiver;
};
export const getShelterWaiver = async (waiverId: string): Promise<Waiver> => {
  const { waiver } = await apiRequest<{ waiver: Waiver }>(
    `/shelter/waivers/${encodeURIComponent(waiverId)}`,
    { auth: 'full' },
  );
  return waiver;
};

export const getMyApplicationWaiver = async (applicationId: string): Promise<Waiver> => {
  const { waiver } = await apiRequest<{ waiver: Waiver }>(
    `/applications/${encodeURIComponent(applicationId)}/waiver`,
    { auth: 'full' },
  );
  return waiver;
};

export const waiverService = {
  listTemplates: listWaiverTemplates,
  listTemplatesPaginated: listWaiverTemplatesPaginated,
  createTemplate: createWaiverTemplate,
  updateTemplate: updateWaiverTemplate,
  generateForApplication: generateApplicationWaiver,
  getApplicationWaiver,
  getShelterWaiver,
  getMyWaiver: getMyApplicationWaiver,
};
