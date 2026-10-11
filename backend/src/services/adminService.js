import { AppError } from '../utils/AppError.js';
import { mapApplication, mapPet, mapShelter, mapUser } from '../utils/mappers.js';
import {
  findShelterWithStaff as fetchShelterWithStaff,
  getRecentApplications as fetchRecentApplications,
  getShelterSummaries as fetchShelterSummaries,
  getSystemStats as fetchSystemStats,
  listSheltersWithCounts as fetchSheltersWithCounts,
} from '../repositories/adminRepository.js';
import {
  findUserById,
  listUsers,
  updateUserRole as persistUserRole,
} from '../repositories/userRepository.js';
import { findShelterById } from '../repositories/shelterRepository.js';
import { listAllPets as fetchAllPets } from '../repositories/petRepository.js';

export const getSystemStats = async () => {
  const [stats, summaryRows, recent] = await Promise.all([
    fetchSystemStats(),
    fetchShelterSummaries(),
    fetchRecentApplications(),
  ]);
  return {
    ...stats,
    shelterSummaries: summaryRows.map((r) => ({
      shelter: mapShelter(r),
      petCount: r.pet_count,
      publicPets: r.public_pets,
      pendingApplications: r.pending_applications,
      staff: r.staff,
    })),
    listingsByShelter: summaryRows.map((r) => ({ name: r.name, value: r.pet_count })),
    recentApplications: recent.rows.map((r) => mapApplication(r)),
    recentPets: recent.pets.map((r) => mapPet(r)),
  };
};

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

export const listSheltersForAdmin = async (pagination) => {
  const { rows, total } = await fetchSheltersWithCounts(pagination);
  return {
    shelters: rows.map((r) => ({
      shelter: mapShelter(r),
      petCount: r.pet_count,
      publicPets: r.public_pets,
      pendingApplications: r.pending_applications,
      staff: r.staff,
    })),
    total,
  };
};

export const getShelterForAdmin = async (id) => {
  const found = await fetchShelterWithStaff(id);
  if (!found) {
    throw new AppError('Shelter not found.', 404);
  }
  const counts = {
    petCount: found.shelter.pet_count,
    publicPets: found.shelter.public_pets,
    pendingApplications: found.shelter.pending_applications,
  };
  return {
    shelter: mapShelter(found.shelter),
    ...counts,
    staff: found.staff.map((u) => ({ id: u.id, name: u.name, email: u.email })),
  };
};
