import {
  deleteShelterVisits,
  getVisitThread,
  listShelterVisits,
  setVisitStatus,
} from '../services/visitService.js';
import { sendSuccess, buildMeta } from '../utils/respond.js';
import { parsePagination } from '../validators/commonValidator.js';

export const getShelterVisits = async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const status = req.query.status || undefined;
  const search = req.query.search || undefined;
  const { threads, total, shelterTotal } = await listShelterVisits(req.user.shelterId, {
    limit,
    offset,
    status,
    search,
  });
  return sendSuccess(
    res,
    { threads, shelterTotal },
    undefined,
    buildMeta(page, limit, total),
  );
};

export const deleteShelterVisitsHandler = async (req, res) => {
  const result = await deleteShelterVisits(req.body.ids, req.user.shelterId);
  return sendSuccess(res, result, 'Visit requests deleted.');
};

export const getShelterVisit = async (req, res) => {
  const { thread } = await getVisitThread(req.params.id, req.user.id, req.user.shelterId);
  return sendSuccess(res, { thread });
};

export const updateVisitStatus = async (req, res) => {
  const thread = await setVisitStatus(req.params.id, req.user.shelterId, req.body);
  return sendSuccess(res, { thread }, `Visit ${thread.status}.`);
};
