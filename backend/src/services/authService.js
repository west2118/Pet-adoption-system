import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { mapUser } from '../utils/mappers.js';
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserProfile,
} from '../repositories/userRepository.js';
import { issueSession, revokeSession, rotateSession } from './sessionService.js';

// Short-lived, limited token issued to a pending shelter registrant so they can
// submit onboarding details and check status. It grants no portal access.
const signOnboardingToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, scope: 'onboarding' },
    env.JWT_SECRET,
    { expiresIn: '2d' },
  );

export const signup = async (input) => {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new AppError('Email is already registered.', 409);
  }

  const role = input.role ?? 'adopter';
  const passwordHash = await bcrypt.hash(input.password, 10);

  if (role === 'shelter_staff') {
    // Shelter staff register as pending: no shelter exists yet. They complete a
    // separate onboarding form, then wait for platform-admin approval.
    const row = await createUser({
      name: input.name,
      email: input.email,
      passwordHash,
      role,
      accountStatus: 'pending',
    });
    const user = mapUser(row);
    const onboardingToken = signOnboardingToken(row);
    return { user, onboardingToken, requiresOnboarding: true };
  }

  const row = await createUser({
    name: input.name,
    email: input.email,
    passwordHash,
    role,
    accountStatus: 'approved',
  });
  const user = mapUser(row);
  const { accessToken: token, refreshToken } = await issueSession(row);
  return { user, token, refreshToken };
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
  if (row.account_status === 'pending') {
    throw new AppError(
      'Your account is awaiting admin approval. You will be notified by email.',
      403,
    );
  }
  if (row.account_status === 'rejected' || row.account_status === 'suspended') {
    throw new AppError('Your account is not active. Please contact support.', 403);
  }
  const user = mapUser(row);
  const { accessToken: token, refreshToken } = await issueSession(row);
  return { user, token, refreshToken };
};

export const refreshSession = async (presentedRefreshToken) =>
  rotateSession(presentedRefreshToken);

export const logoutSession = async (presentedRefreshToken) => {
  await revokeSession(presentedRefreshToken);
  return { revoked: true };
};

export const getMe = async (userId) => {
  const row = await findUserById(userId);
  if (!row) {
    throw new AppError('User not found.', 404);
  }
  return mapUser(row);
};

export const updateProfile = async (userId, input) => {
  const avatarUrl =
    input.avatarUrl === undefined || input.avatarUrl === null
      ? input.avatarUrl
      : input.avatarUrl.trim() === ''
        ? null
        : input.avatarUrl.trim();
  const row = await updateUserProfile(userId, { name: input.name, avatarUrl });
  if (!row) {
    throw new AppError('User not found.', 404);
  }
  return mapUser(row);
};
