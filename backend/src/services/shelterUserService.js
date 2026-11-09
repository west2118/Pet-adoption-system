import bcrypt from 'bcryptjs';
import { AppError } from '../utils/AppError.js';
import { mapUser } from '../utils/mappers.js';
import {
  countShelterUsers,
  createUser,
  deleteShelterUser as removeShelterUserRow,
  findUserByEmail,
  findUserById,
  listUsersByShelter,
  updateShelterUser as persistShelterUser,
} from '../repositories/userRepository.js';

// Per-shelter account cap: one admin (the owner) plus two staff accounts.
export const MAX_SHELTER_USERS = 3;
const MAX_SHELTER_ADMINS = 1;

/**
 * Enforces the per-shelter account limits before a user is added or promoted.
 * `exceptUserId` lets an existing admin be re-saved without counting itself.
 */
export const assertShelterUserCapacity = async (
  shelterId,
  { addingUser = false, promotingAdmin = false, exceptUserId = null } = {},
) => {
  const { total, admins } = await countShelterUsers(shelterId, exceptUserId);
  if (addingUser && total >= MAX_SHELTER_USERS) {
    throw new AppError(
      `A shelter can have at most ${MAX_SHELTER_USERS} accounts (1 admin and 2 staff).`,
      409,
    );
  }
  if (promotingAdmin && admins >= MAX_SHELTER_ADMINS) {
    throw new AppError('A shelter can only have one admin account.', 409);
  }
};

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

  await assertShelterUserCapacity(shelterId, {
    addingUser: true,
    promotingAdmin: input.accountType === 'admin',
  });

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
  if (input.accountType === 'admin' && !existing.is_owner) {
    await assertShelterUserCapacity(shelterId, {
      promotingAdmin: true,
      exceptUserId: userId,
    });
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
