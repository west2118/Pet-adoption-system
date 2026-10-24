import { AppError } from '../utils/AppError.js';
import { mapInquiry } from '../utils/mappers.js';
import {
  createInquiry,
  findInquiryById,
  listInquiriesByShelter,
  markInquiryEmailed,
  markInquiryResolved,
} from '../repositories/inquiryRepository.js';
import { findPetById } from '../repositories/petRepository.js';
import { sendInquiryReplyEmail } from './mailerService.js';

export const submitInquiry = async (input) => {
  const pet = await findPetById(input.petId);
  if (!pet || pet.visibility !== 'public') {
    throw new AppError('Pet not found or not publicly available.', 404);
  }
  const row = await createInquiry(input);
  return mapInquiry(row);
};

export const listShelterInquiries = async (shelterId, options = {}) => {
  const { rows, total } = await listInquiriesByShelter(shelterId, options);
  return { inquiries: rows.map((r) => mapInquiry(r)), total };
};

export const resolveInquiry = async (id, shelterId) => {
  const row = await findInquiryById(id);
  if (!row) {
    throw new AppError('Inquiry not found.', 404);
  }
  if (row.shelter_id !== shelterId) {
    throw new AppError('Forbidden. Inquiry belongs to another shelter.', 403);
  }
  const updated = await markInquiryResolved(id);
  return mapInquiry(updated);
};

/**
 * Sends the shelter's reply to the inquiry author. An inquiry can only be
 * emailed once; the successful send is persisted so the inbox action hides
 * and the details modal can show exactly what was sent.
 */
export const sendInquiryEmail = async (id, shelterId, { subject, message }) => {
  const row = await findInquiryById(id);
  if (!row) {
    throw new AppError('Inquiry not found.', 404);
  }
  if (row.shelter_id !== shelterId) {
    throw new AppError('Forbidden. Inquiry belongs to another shelter.', 403);
  }
  if (row.emailed_at) {
    throw new AppError('An email has already been sent for this inquiry.', 409);
  }

  const mail = await sendInquiryReplyEmail({
    to: row.from_email,
    name: row.from_name,
    petName: row.pet_name,
    petId: row.pet_id,
    shelterName: row.shelter_name ?? 'the shelter',
    shelterEmail: row.shelter_email ?? undefined,
    subject,
    message,
  }).catch(() => ({ sent: false, stubbed: false, error: true }));

  const emailSent = mail.sent === true;
  const emailStubbed = mail.stubbed === true;

  let inquiry = mapInquiry(row);
  if (emailSent) {
    const updated = await markInquiryEmailed(id, { subject, message });
    inquiry = mapInquiry(updated);
  }

  return { inquiry, emailSent, emailStubbed };
};
