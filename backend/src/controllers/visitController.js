import {
  cancelVisit,
  getMyVisitSummary as fetchMyVisitSummary,
  getVisitThread,
  listMyVisits,
  postVisitMessage,
  requestVisit,
} from '../services/visitService.js';
import { sendSuccess, buildMeta } from '../utils/respond.js';
import { parsePagination } from '../validators/commonValidator.js';

export const createVisit = async (req, res) => {
  const { thread, messages } = await requestVisit(req.user.id, req.body);
  return sendSuccess(res, { thread, messages }, 'Visit request sent.', undefined, 201);
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

export const getVisit = async (req, res) => {
  const { thread, messages } = await getVisitThread(req.params.id, req.user.id, null);
  return sendSuccess(res, { thread, messages });
};

export const postMessage = async (req, res) => {
  const message = await postVisitMessage(req.params.id, req.user.id, null, req.body.body);
  return sendSuccess(res, { message }, 'Message sent.', undefined, 201);
};

export const cancelMyVisit = async (req, res) => {
  const thread = await cancelVisit(req.params.id, req.user.id, req.body.cancelReason);
  return sendSuccess(res, { thread }, 'Visit cancelled.');
};
