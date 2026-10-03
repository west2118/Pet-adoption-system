import { AppError } from '../utils/AppError.js';
import { mapPet } from '../utils/mappers.js';
import {
  createPet,
  deletePet,
  findPetById,
  listPetsByShelter,
  updatePet,
} from '../repositories/petRepository.js';

const assertOwnership = (petRow, shelterId) => {
  if (!petRow) {
    throw new AppError('Pet listing not found.', 404);
  }
  if (petRow.shelter_id !== shelterId) {
    throw new AppError('Forbidden. Listing belongs to another shelter.', 403);
  }
};

export const listShelterListings = async (shelterId, pagination) => {
  const { rows, total } = await listPetsByShelter(shelterId, pagination);
  return { pets: rows.map((r) => mapPet(r)), total };
};

export const createListing = async (input, shelterId) => {
  const row = await createPet(input, shelterId);
  return mapPet(row);
};

export const updateListing = async (id, patch, shelterId) => {
  const current = await findPetById(id);
  assertOwnership(current, shelterId);
  const row = await updatePet(id, patch);
  return mapPet(row);
};

export const removeListing = async (id, shelterId) => {
  const current = await findPetById(id);
  assertOwnership(current, shelterId);
  await deletePet(id);
  return { id };
};
