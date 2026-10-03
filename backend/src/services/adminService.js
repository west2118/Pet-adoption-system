import { AppError } from '../utils/AppError.js';
import { mapPet, mapUser } from '../utils/mappers.js';
import { getSystemStats as fetchSystemStats } from '../repositories/adminRepository.js';
import {
  findUserById,
  listUsers,
  updateUserRole as persistUserRole,
} from '../repositories/userRepository.js';
import { findShelterById } from '../repositories/shelterRepository.js';
import { listAllPets as fetchAllPets } from '../repositories/petRepository.js';

export const getSystemStats = async () => fetchSystemStats();

export const listAllUsers = async (pagination) => {
  const { rows, total } = await listUsers(pagination);
  return { users: rows.map((r) => mapUser(r)), total };
};

export const setUserRole = async (id, role, shelterId) => {
  const existing = await findUserById(id);
  if (!existing) {
    throw new AppError('User not found.', 404);
  }
  if (role === 'shelter_staff') {
    if (!shelterId) {
      throw new AppError('shelterId is required when assigning shelter_staff role.', 400);
    }
    const shelter = await findShelterById(shelterId);
    if (!shelter) {
      throw new AppError('Assigned shelter not found.', 404);
    }
  }
  const row = await persistUserRole(id, role, role === 'shelter_staff' ? shelterId : null);
  return mapUser(row);
};

export const listAllPets = async (pagination) => {
  const { rows, total } = await fetchAllPets(pagination);
  return { pets: rows.map((r) => mapPet(r)), total };
};
