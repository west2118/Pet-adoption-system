import {
  cancelVisit,
  getMyVisitForPet as fetchMyVisitForPet,
  getMyVisitSummary as fetchMyVisitSummary,
  listMyVisits,
  requestVisit,
} from '../services/visitService.js';
import { sendSuccess, buildMeta } from '../utils/respond.js';
import { parsePagination } from '../validators/commonValidator.js';

export const createVisit = async (req, res) => {
  const { thread } = await requestVisit(req.user.id, req.body);
  return sendSuccess(res, { thread }, 'Visit request sent.', undefined, 201);
};

export const getMyVisits = async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const status = req.query.status || undefined;
  const { threads, total } = await listMyVisits(req.user.id, { limit, offset, status });
  return sendSuccess(res, { threads }, undefined, buildMeta(page, limit, total));
};

export const getMyVisitSummary = async (req, res) => {
  const summary = await fetchMyVisitSummary(req.user.id);
  return sendSuccess(res, { summary });
};

export const getMyVisitForPet = async (req, res) => {
  const visit = await fetchMyVisitForPet(req.user.id, req.params.petId);
  return sendSuccess(res, { visit });
};

export const cancelMyVisit = async (req, res) => {
  const thread = await cancelVisit(req.params.id, req.user.id, req.body.cancelReason);
  return sendSuccess(res, { thread }, 'Visit request cancelled.');
};
