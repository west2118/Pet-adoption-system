import {
  approveShelterApplication,
  getMyShelterApplication,
  listShelterApplications,
  rejectShelterApplication,
  submitShelterApplication,
} from '../services/shelterApplicationService.js';
import { sendSuccess, buildMeta } from '../utils/respond.js';
import { parsePagination } from '../validators/commonValidator.js';

export const createShelterApplication = async (req, res) => {
  const application = await submitShelterApplication(req.user.id, req.body);
  return sendSuccess(
    res,
    { application },
    'Shelter details submitted. Your account is pending admin approval.',
    undefined,
    201,
  );
};

export const getMyApplication = async (req, res) => {
  const application = await getMyShelterApplication(req.user.id);
  return sendSuccess(res, { application });
};

export const getShelterApplications = async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const status = req.query.status || undefined;
  const search = req.query.search || undefined;
  const { applications, total } = await listShelterApplications({
    status,
    search,
    limit,
    offset,
  });
  return sendSuccess(res, { applications }, undefined, buildMeta(page, limit, total));
};

export const approveApplication = async (req, res) => {
  const result = await approveShelterApplication(req.params.id);
  return sendSuccess(res, result, 'Shelter application approved.');
};

export const rejectApplication = async (req, res) => {
  const application = await rejectShelterApplication(req.params.id, req.body.reviewNote);
  return sendSuccess(res, { application }, 'Shelter application rejected.');
};
