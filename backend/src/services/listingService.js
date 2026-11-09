import { AppError } from '../utils/AppError.js';
import { mapPet } from '../utils/mappers.js';
import {
  countPetsByShelter,
  createPet,
  deletePet,
  deletePetsByIds,
  findPetById,
  listPetsByShelter,
  updatePet,
} from '../repositories/petRepository.js';

// Hard cap so a shelter's inventory cannot grow without bound.
const MAX_PETS_PER_SHELTER = 150;

const assertOwnership = (petRow, shelterId) => {
  if (!petRow) {
    throw new AppError('Pet listing not found.', 404);
  }
  if (petRow.shelter_id !== shelterId) {
    throw new AppError('Forbidden. Listing belongs to another shelter.', 403);
  }
};

export const listShelterListings = async (shelterId, pagination) => {
  const [{ rows, total }, shelterTotal] = await Promise.all([
    listPetsByShelter(shelterId, pagination),
    countPetsByShelter(shelterId),
  ]);
  return { pets: rows.map((r) => mapPet(r)), total, shelterTotal };
};

export const createListing = async (input, shelterId) => {
  const petCount = await countPetsByShelter(shelterId);
  if (petCount >= MAX_PETS_PER_SHELTER) {
    throw new AppError(
      `A shelter can have at most ${MAX_PETS_PER_SHELTER} pet listings.`,
      409,
    );
  }
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

/** Removes selected listings; IDs from other shelters are ignored. */
export const removeListings = async (ids, shelterId) => {
  const deletedIds = await deletePetsByIds(ids, shelterId);
  return { deleted: deletedIds.length };
};
