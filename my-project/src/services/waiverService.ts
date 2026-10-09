import { apiRequest } from '@/lib/apiClient';
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
  createTemplate: createWaiverTemplate,
  updateTemplate: updateWaiverTemplate,
  generateForApplication: generateApplicationWaiver,
  getApplicationWaiver,
  getShelterWaiver,
  getMyWaiver: getMyApplicationWaiver,
};
