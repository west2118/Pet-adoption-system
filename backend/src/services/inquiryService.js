import { AppError } from '../utils/AppError.js';
import { mapInquiry } from '../utils/mappers.js';
import {
  createInquiry,
  findInquiryById,
  listInquiriesByShelter,
  markInquiryResolved,
} from '../repositories/inquiryRepository.js';
import { findPetById } from '../repositories/petRepository.js';

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
