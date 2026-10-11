import {
  getVisitThread,
  listShelterVisits,
  postVisitMessage,
  setVisitStatus,
} from '../services/visitService.js';
import { sendSuccess, buildMeta } from '../utils/respond.js';
import { parsePagination } from '../validators/commonValidator.js';

export const getShelterVisits = async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const status = req.query.status || undefined;
  const { threads, total } = await listShelterVisits(req.user.shelterId, { limit, offset, status });
  return sendSuccess(res, { threads }, undefined, buildMeta(page, limit, total));
};

export const getShelterVisit = async (req, res) => {
  const { thread, messages } = await getVisitThread(req.params.id, req.user.id, req.user.shelterId);
  return sendSuccess(res, { thread, messages });
};

export const postShelterMessage = async (req, res) => {
  const message = await postVisitMessage(req.params.id, req.user.id, req.user.shelterId, req.body.body);
  return sendSuccess(res, { message }, 'Message sent.', undefined, 201);
};

export const updateVisitStatus = async (req, res) => {
  const thread = await setVisitStatus(req.params.id, req.user.shelterId, req.body);
  return sendSuccess(res, { thread }, `Visit ${thread.status}.`);
};
