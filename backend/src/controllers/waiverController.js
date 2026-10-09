import {
  createWaiverTemplate,
  generateWaiver,
  getAdopterWaiver,
  getWaiver,
  getWaiverForApplication,
  listWaiverTemplates,
  updateWaiverTemplate,
} from '../services/waiverService.js';
import { sendSuccess, buildMeta } from '../utils/respond.js';
import { parsePagination } from '../validators/commonValidator.js';

export const getWaiverTemplates = async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const category = req.query.category || undefined;
  const search = req.query.search || undefined;
  const { templates, total } = await listWaiverTemplates(req.user.shelterId, {
    limit,
    offset,
    category,
    search,
  });
  return sendSuccess(res, { templates }, undefined, buildMeta(page, limit, total));
};

export const addWaiverTemplate = async (req, res) => {
  const template = await createWaiverTemplate(req.user.shelterId, req.body);
  return sendSuccess(res, { template }, 'Waiver template created successfully.', undefined, 201);
};

export const editWaiverTemplate = async (req, res) => {
  const template = await updateWaiverTemplate(req.params.id, req.body, req.user.shelterId);
  return sendSuccess(res, { template }, 'Waiver template updated successfully.');
};

export const generateApplicationWaiver = async (req, res) => {
  const waiver = await generateWaiver(req.params.id, req.user.shelterId, req.body.templateIds);
  return sendSuccess(res, { waiver }, 'E-waiver generated successfully.', undefined, 201);
};

export const getApplicationWaiver = async (req, res) => {
  const waiver = await getWaiverForApplication(req.params.id, req.user.shelterId);
  return sendSuccess(res, { waiver });
};

export const getWaiverById = async (req, res) => {
  const waiver = await getWaiver(req.params.id, req.user.shelterId);
  return sendSuccess(res, { waiver });
};

export const getMyApplicationWaiver = async (req, res) => {
  const waiver = await getAdopterWaiver(req.params.id, req.user.id);
  return sendSuccess(res, { waiver });
};
