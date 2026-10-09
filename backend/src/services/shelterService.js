import { AppError } from '../utils/AppError.js';
import { mapShelter } from '../utils/mappers.js';
import {
  createShelter as createShelterRow,
  findShelterByEmail,
  findShelterById as findShelterRowById,
  getShelterStats as readShelterStats,
  listShelters as listShelterRows,
  updateShelter as updateShelterRow,
} from '../repositories/shelterRepository.js';

/** Header numbers for the shelters page, independent of the paged list. */
export const getShelterStats = async () => {
  const row = await readShelterStats();
  return { total: row.total, cities: row.cities, petsInCare: row.pets_in_care };
};

export const listShelters = async (pagination) => {
  const { rows, total } = await listShelterRows(pagination);
  const shelters = rows.map((r) =>
    mapShelter(r, r.active_listings, r.total_pets),
  );
  return { shelters, total };
};

export const getShelterById = async (id) => {
  const row = await findShelterRowById(id);
  if (!row) {
    throw new AppError('Shelter not found.', 404);
  }
  return mapShelter(row, row.active_listings, row.total_pets);
};

export const createShelter = async (input) => {
  const existing = await findShelterByEmail(input.email);
  if (existing) {
    throw new AppError('Shelter email is already registered.', 409);
  }
  const row = await createShelterRow(input);
  return mapShelter(row, 0, 0);
};

export const updateShelter = async (id, patch, actor) => {
  const row = await findShelterRowById(id);
  if (!row) {
    throw new AppError('Shelter not found.', 404);
  }
  if (actor.role === 'shelter_staff' && actor.shelterId !== id) {
    throw new AppError('Forbidden. Access restricted to assigned shelter data.', 403);
  }
  if (patch.email && patch.email !== row.email) {
    const taken = await findShelterByEmail(patch.email);
    if (taken) {
      throw new AppError('Shelter email is already registered.', 409);
    }
  }
  const updated = await updateShelterRow(id, patch);
  const fresh = await findShelterRowById(id);
  return mapShelter(fresh ?? updated, fresh?.active_listings ?? 0, fresh?.total_pets ?? 0);
};
