import { listShelterInquiries, resolveInquiry, submitInquiry } from '../services/inquiryService.js';
import { sendSuccess, buildMeta } from '../utils/respond.js';
import { parsePagination } from '../validators/commonValidator.js';

const parseResolved = (value) => {
  if (value === undefined || value === '') return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

export const createInquiry = async (req, res) => {
  const inquiry = await submitInquiry(req.body);
  return sendSuccess(res, { inquiry }, 'Inquiry submitted successfully.', undefined, 201);
};

export const getShelterInquiries = async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const resolved = parseResolved(req.query.resolved);
  const { inquiries, total } = await listShelterInquiries(
    req.user.shelterId,
    { limit, offset },
    resolved,
  );
  return sendSuccess(res, { inquiries }, undefined, buildMeta(page, limit, total));
};

export const markInquiryResolved = async (req, res) => {
  const inquiry = await resolveInquiry(req.params.id, req.user.shelterId);
  return sendSuccess(res, { inquiry }, 'Inquiry marked as resolved.');
};
