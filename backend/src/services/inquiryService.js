import { AppError } from '../utils/AppError.js';
import { mapInquiry } from '../utils/mappers.js';
import {
  countInquiriesByShelter,
  createInquiry,
  deleteInquiriesByIds,
  findInquiryById,
  listInquiriesByShelter,
  markInquiryEmailed,
  markInquiryResolved,
} from '../repositories/inquiryRepository.js';
import { findPetById } from '../repositories/petRepository.js';
import { sendInquiryReplyEmail } from './mailerService.js';

// Hard cap so a shelter's inquiry inbox cannot grow without bound.
const MAX_INQUIRIES_PER_SHELTER = 150;

export const submitInquiry = async (input) => {
  const pet = await findPetById(input.petId);
  if (!pet || pet.visibility !== 'public') {
    throw new AppError('Pet not found or not publicly available.', 404);
  }
  const inquiryCount = await countInquiriesByShelter(pet.shelter_id);
  if (inquiryCount >= MAX_INQUIRIES_PER_SHELTER) {
    throw new AppError(
      'This shelter has received too many inquiries right now. Please try again later.',
      429,
    );
  }
  const row = await createInquiry(input);
  return mapInquiry(row);
};

/** Removes selected inquiries; IDs from other shelters are ignored. */
export const deleteShelterInquiries = async (ids, shelterId) => {
  const deletedIds = await deleteInquiriesByIds(ids, shelterId);
  return { deleted: deletedIds.length };
};

export const listShelterInquiries = async (shelterId, options = {}) => {
  const [{ rows, total }, shelterTotal] = await Promise.all([
    listInquiriesByShelter(shelterId, options),
    countInquiriesByShelter(shelterId),
  ]);
  return { inquiries: rows.map((r) => mapInquiry(r)), total, shelterTotal };
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
