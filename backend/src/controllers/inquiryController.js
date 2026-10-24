import {
  listShelterInquiries,
  resolveInquiry,
  sendInquiryEmail,
  submitInquiry,
} from '../services/inquiryService.js';
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
  const search = req.query.search || undefined;
  const { inquiries, total } = await listShelterInquiries(
    req.user.shelterId,
    { limit, offset, resolved, search },
  );
  return sendSuccess(res, { inquiries }, undefined, buildMeta(page, limit, total));
};

export const markInquiryResolved = async (req, res) => {
  const inquiry = await resolveInquiry(req.params.id, req.user.shelterId);
  return sendSuccess(res, { inquiry }, 'Inquiry marked as resolved.');
};

export const emailInquiry = async (req, res) => {
  const { inquiry, emailSent, emailStubbed } = await sendInquiryEmail(
    req.params.id,
    req.user.shelterId,
    req.body,
  );
  const message = emailSent
    ? 'Email sent to the inquirer.'
    : emailStubbed
      ? 'Email was not sent because SMTP is not configured.'
      : 'Email could not be sent.';
  return sendSuccess(res, { inquiry, emailSent, emailStubbed }, message);
};
