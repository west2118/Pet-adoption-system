import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { mapUser } from '../utils/mappers.js';
import {
  createUser,
  findUserByEmail,
  findUserById,
} from '../repositories/userRepository.js';
import { findShelterById } from '../repositories/shelterRepository.js';

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, shelterId: user.shelter_id ?? undefined },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  );

export const signup = async (input) => {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new AppError('Email is already registered.', 409);
  }
  if (input.role === 'shelter_staff') {
    if (!input.shelterId) {
      throw new AppError('shelterId is required for shelter staff accounts.', 400);
    }
    const shelter = await findShelterById(input.shelterId);
    if (!shelter) {
      throw new AppError('Assigned shelter not found.', 404);
    }
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  const row = await createUser({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role ?? 'adopter',
    shelterId: input.shelterId ?? null,
  });
  const user = mapUser(row);
  const token = signToken(row);
  return { user, token };
};

export const login = async (input) => {
  const row = await findUserByEmail(input.email);
  if (!row) {
    throw new AppError('Invalid email or password.', 401);
  }
  const ok = await bcrypt.compare(input.password, row.password_hash);
  if (!ok) {
    throw new AppError('Invalid email or password.', 401);
  }
  const user = mapUser(row);
  const token = signToken(row);
  return { user, token };
};

export const getMe = async (userId) => {
  const row = await findUserById(userId);
  if (!row) {
    throw new AppError('User not found.', 404);
  }
  return mapUser(row);
};
