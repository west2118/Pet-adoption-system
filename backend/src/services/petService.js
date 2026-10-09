import { AppError } from '../utils/AppError.js';
import { mapPet } from '../utils/mappers.js';
import {
  findPublicPetById,
  listPetFacets,
  listPublicPets,
} from '../repositories/petRepository.js';

export const getPublicPets = async (filters, pagination) => {
  const { rows, total } = await listPublicPets(filters, pagination);
  return { pets: rows.map((r) => mapPet(r)), total };
};

export const getPublicPetFacets = async () => listPetFacets();

export const getPublicPetById = async (id) => {
  const row = await findPublicPetById(id);
  if (!row) {
    throw new AppError('Pet not found or not publicly available.', 404);
  }
  return mapPet(row);
};
