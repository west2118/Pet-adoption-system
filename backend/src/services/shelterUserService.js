import bcrypt from 'bcryptjs';
import { AppError } from '../utils/AppError.js';
import { mapUser } from '../utils/mappers.js';
import {
  createUser,
  deleteShelterUser as removeShelterUserRow,
  findUserByEmail,
  findUserById,
  listUsersByShelter,
  updateShelterUser as persistShelterUser,
} from '../repositories/userRepository.js';

export const listShelterUsers = async (shelterId, pagination) => {
  const { rows, total } = await listUsersByShelter(shelterId, pagination);
  return { users: rows.map((row) => mapUser(row)), total };
};

export const addShelterUser = async (shelterId, input) => {
  const email = input.email.trim();
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError('Email is already registered.', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const row = await createUser({
    name: input.name.trim(),
    email,
    passwordHash,
    role: 'shelter_staff',
    shelterId,
    accountStatus: 'approved',
    isOwner: input.accountType === 'admin',
  });
  return mapUser(row);
};

export const editShelterUser = async (shelterId, userId, input, actorId) => {
  const existing = await findUserById(userId);
  if (!existing || existing.shelter_id !== shelterId || existing.role !== 'shelter_staff') {
    throw new AppError('User not found in this shelter.', 404);
  }
  if (userId === actorId && input.accountType === 'staff' && existing.is_owner) {
    throw new AppError('You cannot remove your own admin access.', 400);
  }

  const email = input.email?.trim();
  if (email && email !== existing.email) {
    const duplicate = await findUserByEmail(email);
    if (duplicate) {
      throw new AppError('Email is already registered.', 409);
    }
  }

  const passwordHash = input.password ? await bcrypt.hash(input.password, 10) : undefined;
  const row = await persistShelterUser(userId, shelterId, {
    name: input.name?.trim(),
    email,
    passwordHash,
    isOwner: input.accountType ? input.accountType === 'admin' : undefined,
  });
  if (!row) {
    throw new AppError('User not found in this shelter.', 404);
  }
  return mapUser(row);
};

export const removeShelterUser = async (shelterId, userId, actorId) => {
  if (userId === actorId) {
    throw new AppError('You cannot remove your own account.', 400);
  }
  const existing = await findUserById(userId);
  if (!existing || existing.shelter_id !== shelterId || existing.role !== 'shelter_staff') {
    throw new AppError('User not found in this shelter.', 404);
  }
  await removeShelterUserRow(userId, shelterId);
};
