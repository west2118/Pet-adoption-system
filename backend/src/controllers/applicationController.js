import { getApplicationSummary, listMyApplications, listShelterApplications, submitApplication, updateApplicationStatus } from '../services/applicationService.js';
import { sendSuccess, buildMeta } from '../utils/respond.js';
import { parsePagination } from '../validators/commonValidator.js';

export const createApplication = async (req, res) => {
  const application = await submitApplication(req.body, req.user.id);
  return sendSuccess(res, { application }, 'Application submitted successfully.', undefined, 201);
};

export const getMyApplications = async (req, res) => {
  // The "My Applications" page shows 5 per page — the backend owns that
  // default; the client only asks for a `page`.
  const { page, limit, offset } = parsePagination(req.query, 5);
  const { applications, total } = await listMyApplications(req.user.id, { limit, offset });
  return sendSuccess(res, { applications }, undefined, buildMeta(page, limit, total));
};

/** Status counters for the adopter's summary bar (independent of paging). */
export const getMyApplicationSummary = async (req, res) => {
  const summary = await getApplicationSummary(req.user.id);
  return sendSuccess(res, { summary });
};

export const getShelterApplications = async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const status = req.query.status || undefined;
  const search = req.query.search || undefined;
  const { applications, total } = await listShelterApplications(
    req.user.shelterId,
    { limit, offset, status, search },
  );
  return sendSuccess(res, { applications }, undefined, buildMeta(page, limit, total));
};

export const setApplicationStatus = async (req, res) => {
  const application = await updateApplicationStatus(
    req.params.id,
    req.user.shelterId,
    req.body.status,
    req.body.note ?? null,
  );
  return sendSuccess(res, { application }, 'Application status updated successfully.');
};
