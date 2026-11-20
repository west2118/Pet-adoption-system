import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { mapUser } from '../utils/mappers.js';
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserPasswordHash,
  updateUserProfile,
} from '../repositories/userRepository.js';
import { findApplicationByUserId } from '../repositories/shelterApplicationRepository.js';
import {
  createLoginChallenge,
  deleteLoginChallenge,
  findLoginChallengeById,
  markChallengeVerified,
  recordChallengeAttempt,
  updateUserLoginLocation,
} from '../repositories/loginChallengeRepository.js';
import {
  createSignupVerification,
  deleteSignupVerification,
  findSignupVerificationById,
  recordSignupVerificationAttempt,
} from '../repositories/signupVerificationRepository.js';
import {
  createPasswordReset,
  deletePasswordReset,
  findPasswordResetById,
  recordPasswordResetAttempt,
} from '../repositories/passwordResetRepository.js';
import {
  extractClientIp,
  isSuspiciousLocation,
  lookupIpLocation,
} from '../utils/locationDetector.js';
import {
  sendLoginOtpEmail,
  sendPasswordResetEmail,
  sendSignupOtpEmail,
} from './mailerService.js';
import {
  issueSession,
  revokeAllSessions,
  revokeSession,
  rotateSession,
} from './sessionService.js';

// Short-lived, limited token issued to a pending shelter registrant so they can
// submit onboarding details and check status. It grants no portal access.
const signOnboardingToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, scope: 'onboarding' },
    env.JWT_SECRET,
    { expiresIn: '2d' },
  );

const requireOtpDelivery = (result, code) => {
  if (!result.sent && !(result.stubbed && env.NODE_ENV !== 'production')) {
    throw new AppError('Unable to send your verification email. Please try again shortly.', 503);
  }
  if (result.stubbed && env.NODE_ENV === 'development') {
    console.log(`[Development verification code]: ${code}`);
  }
};

export const signup = async (input) => {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new AppError('Email is already registered.', 409);
  }

  const role = input.role ?? 'adopter';
  const passwordHash = await bcrypt.hash(input.password, 10);
  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const verification = await createSignupVerification({
    name: input.name,
    email: input.email,
    passwordHash,
    role,
    otpHash,
    expiresAt,
  });

  // Send real email with 6-digit registration code
  const mailResult = await sendSignupOtpEmail({
    to: input.email,
    name: input.name,
    code: otp,
  });
  requireOtpDelivery(mailResult, otp);

  return {
    otpRequired: true,
    verificationId: verification.id,
    email: input.email,
  };
};

export const verifySignupOtp = async ({ verificationId, code }) => {
  const record = await findSignupVerificationById(verificationId);
  if (!record) {
    throw new AppError('Registration session expired or invalid. Please sign up again.', 400);
  }

  if (new Date(record.expires_at) < new Date()) {
    throw new AppError('Verification code has expired. Please sign up again.', 400);
  }

  if (record.attempts >= 5) {
    throw new AppError('Too many incorrect attempts. Please sign up again.', 429);
  }

  const expectedHash = record.otp_hash;
  const providedHash = hashOtp(code || '');

  if (expectedHash !== providedHash) {
    await recordSignupVerificationAttempt(verificationId);
    throw new AppError('Invalid 6-digit verification code.', 400);
  }

  // Double check email wasn't registered in the interim
  const existing = await findUserByEmail(record.email);
  if (existing) {
    await deleteSignupVerification(verificationId);
    throw new AppError('Email is already registered.', 409);
  }

  // Create the verified user account
  const role = record.role;
  const passwordHash = record.password_hash;

  if (role === 'shelter_staff') {
    const row = await createUser({
      name: record.name,
      email: record.email,
      passwordHash,
      role,
      accountStatus: 'pending',
    });
    await deleteSignupVerification(verificationId);
    const user = mapUser(row);
    const onboardingToken = signOnboardingToken(row);
    return { user, onboardingToken, requiresOnboarding: true };
  }

  const row = await createUser({
    name: record.name,
    email: record.email,
    passwordHash,
    role,
    accountStatus: 'approved',
  });
  await deleteSignupVerification(verificationId);
  const user = mapUser(row);
  const { accessToken: token, refreshToken } = await issueSession(row);
  return { user, token, refreshToken };
};

export const resendSignupOtp = async ({ verificationId }) => {
  const record = await findSignupVerificationById(verificationId);
  if (!record) {
    throw new AppError('Registration session expired or invalid. Please sign up again.', 400);
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const verification = await createSignupVerification({
    name: record.name,
    email: record.email,
    passwordHash: record.password_hash,
    role: record.role,
    otpHash,
    expiresAt,
  });

  const mailResult = await sendSignupOtpEmail({
    to: record.email,
    name: record.name,
    code: otp,
  });
  try {
    requireOtpDelivery(mailResult, otp);
  } catch (error) {
    // The new code never reached the inbox — keep the previous one usable.
    await deleteSignupVerification(verification.id);
    throw error;
  }

  // Only the code from the newest email stays valid.
  await deleteSignupVerification(verificationId);

  return {
    verificationId: verification.id,
    message: 'A new 6-digit verification code has been sent to your email.',
  };
};

/**
 * Pending shelter accounts get a limited onboarding token. It is attached to
 * the error only so the controller layer can write it into an httpOnly cookie
 * — it must never be serialized into the response body.
 */
const pendingAccountError = (message, requiresOnboarding, onboardingToken) => {
  const error = new AppError(message, 403, { requiresOnboarding });
  error.onboardingToken = onboardingToken;
  return error;
};

// Generate a cryptographically secure 6-digit OTP string
const generateOtp = () => {
  const num = crypto.randomInt(100000, 1000000);
  return String(num);
};

const hashOtp = (code) =>
  crypto.createHash('sha256').update(code.trim()).digest('hex');

export const login = async (input, reqContext = {}) => {
  const row = await findUserByEmail(input.email);
  if (!row) {
    throw new AppError('Invalid email or password.', 401);
  }
  const ok = await bcrypt.compare(input.password, row.password_hash);
  if (!ok) {
    throw new AppError('Invalid email or password.', 401);
  }
  if (row.account_status === 'pending') {
    const application = await findApplicationByUserId(row.id);
    const onboardingToken = signOnboardingToken(row);

    if (!application) {
      // User registered as shelter staff/admin but hasn't submitted their shelter onboarding yet!
      throw pendingAccountError(
        'Please complete your shelter registration.',
        true,
        onboardingToken,
      );
    }

    throw pendingAccountError(
      'Your account is awaiting admin approval. You will be notified by email.',
      false,
      onboardingToken,
    );
  }
  if (row.account_status === 'rejected' || row.account_status === 'suspended') {
    throw new AppError('Your account is not active. Please contact support.', 403);
  }

  // Location / IP detection for suspicious activity
  const ipAddress = reqContext.ip || '127.0.0.1';
  const clientLocation = input.clientLocation || reqContext.clientLocation || null;
  const ipLocation = await lookupIpLocation(ipAddress);

  const locationDisplay =
    clientLocation ||
    (ipLocation.city && ipLocation.country
      ? `${ipLocation.city}, ${ipLocation.country}`
      : ipLocation.city || ipLocation.country || 'Unknown location');

  // Platform admins sign in directly; only adopters and shelter staff get the
  // emailed code from an unrecognised location.
  const suspicious =
    row.role !== 'platform_admin' && isSuspiciousLocation(row, ipLocation, clientLocation);

  if (suspicious) {
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const challenge = await createLoginChallenge({
      userId: row.id,
      otpHash,
      ipAddress,
      city: ipLocation.city || clientLocation,
      country: ipLocation.country,
      clientLocation,
      latitude: ipLocation.lat,
      longitude: ipLocation.lon,
      expiresAt,
    });

    // Confirm delivery before returning the verification challenge.
    const mailResult = await sendLoginOtpEmail({
      to: row.email,
      name: row.name,
      code: otp,
      locationDisplay,
      ipAddress,
    });
    requireOtpDelivery(mailResult, otp);

    // Obfuscate email for prompt
    const parts = row.email.split('@');
    const maskedUser =
      parts[0].length <= 2
        ? parts[0] + '***'
        : parts[0].slice(0, 2) + '***' + parts[0].slice(-1);
    const maskedEmail = `${maskedUser}@${parts[1]}`;

    return {
      mfaRequired: true,
      challengeId: challenge.id,
      email: maskedEmail,
      location: locationDisplay,
    };
  }

  // Login from recognized / baseline location: update record and proceed
  await updateUserLoginLocation(row.id, {
    ip: ipAddress,
    city: ipLocation.city || clientLocation,
    country: ipLocation.country,
    lat: ipLocation.lat,
    lon: ipLocation.lon,
  });

  const user = mapUser(row);
  const { accessToken: token, refreshToken } = await issueSession(row);
  return { user, token, refreshToken };
};

export const verifyLoginOtp = async ({ challengeId, code }) => {
  const challenge = await findLoginChallengeById(challengeId);
  if (!challenge) {
    throw new AppError('Verification session expired or invalid. Please sign in again.', 400);
  }

  if (challenge.verified) {
    throw new AppError('This verification code has already been used.', 400);
  }

  if (new Date(challenge.expires_at) < new Date()) {
    throw new AppError('Verification code has expired. Please sign in again.', 400);
  }

  if (challenge.attempts >= 5) {
    throw new AppError('Too many incorrect attempts. Please sign in again.', 429);
  }

  const expectedHash = challenge.otp_hash;
  const providedHash = hashOtp(code || '');

  if (expectedHash !== providedHash) {
    await recordChallengeAttempt(challengeId);
    throw new AppError('Invalid 6-digit verification code.', 400);
  }

  await markChallengeVerified(challengeId);

  // Challenge verified: record new location as verified trusted location
  await updateUserLoginLocation(challenge.user_id, {
    ip: challenge.ip_address,
    city: challenge.city || challenge.client_location,
    country: challenge.country,
    lat: challenge.latitude,
    lon: challenge.longitude,
  });

  const row = await findUserById(challenge.user_id);
  const user = mapUser(row);
  const { accessToken: token, refreshToken } = await issueSession(row);
  return { user, token, refreshToken };
};

export const resendLoginOtp = async ({ challengeId }) => {
  const challenge = await findLoginChallengeById(challengeId);
  if (!challenge) {
    throw new AppError('Verification session expired or invalid. Please sign in again.', 400);
  }

  if (challenge.verified) {
    throw new AppError('Verification is already completed.', 400);
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const newChallenge = await createLoginChallenge({
    userId: challenge.user_id,
    otpHash,
    ipAddress: challenge.ip_address,
    city: challenge.city,
    country: challenge.country,
    clientLocation: challenge.client_location,
    latitude: challenge.latitude,
    longitude: challenge.longitude,
    expiresAt,
  });

  const locationDisplay =
    challenge.client_location ||
    (challenge.city && challenge.country
      ? `${challenge.city}, ${challenge.country}`
      : challenge.city || challenge.country || 'Unknown location');

  const mailResult = await sendLoginOtpEmail({
    to: challenge.email,
    name: challenge.name,
    code: otp,
    locationDisplay,
    ipAddress: challenge.ip_address,
  });
  try {
    requireOtpDelivery(mailResult, otp);
  } catch (error) {
    // The new code never reached the inbox — keep the previous one usable.
    await deleteLoginChallenge(newChallenge.id);
    throw error;
  }

  // Only the code from the newest email stays valid.
  await deleteLoginChallenge(challengeId);

  return {
    challengeId: newChallenge.id,
    message: 'A new 6-digit verification code has been sent to your email.',
  };
};

/**
 * Starts a password reset. The response never reveals whether the email is
 * registered: unknown or inactive accounts get the same generic answer, with
 * no `resetId` to continue the flow.
 */
export const requestPasswordReset = async ({ email }) => {
  const row = await findUserByEmail(email);
  const inactive =
    !row || row.account_status === 'rejected' || row.account_status === 'suspended';
  if (inactive) {
    return { sent: true, resetId: null };
  }

  const otp = generateOtp();
  const reset = await createPasswordReset({
    userId: row.id,
    email: row.email,
    otpHash: hashOtp(otp),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });

  const mailResult = await sendPasswordResetEmail({
    to: row.email,
    name: row.name,
    code: otp,
  });
  requireOtpDelivery(mailResult, otp);

  return { sent: true, resetId: reset.id, email: row.email };
};

/**
 * Loads a reset request and checks the presented code against it. The row is
 * not consumed here so the code can be verified first and then used to set the
 * new password.
 */
const requireValidResetCode = async ({ resetId, code }) => {
  const record = await findPasswordResetById(resetId);
  if (!record) {
    throw new AppError('This reset code is no longer valid. Please request a new one.', 400);
  }

  if (new Date(record.expires_at) < new Date()) {
    await deletePasswordReset(resetId);
    throw new AppError('Your reset code has expired. Please request a new one.', 400);
  }

  if (record.attempts >= 5) {
    throw new AppError('Too many incorrect attempts. Please request a new code.', 429);
  }

  if (record.otp_hash !== hashOtp(code || '')) {
    await recordPasswordResetAttempt(resetId);
    throw new AppError('Invalid 6-digit reset code.', 400);
  }

  return record;
};

/** Checks the emailed code so the UI can move on to the new-password step. */
export const verifyPasswordResetCode = async ({ resetId, code }) => {
  await requireValidResetCode({ resetId, code });
  return { verified: true };
};

/**
 * Completes a reset: the emailed code is checked against the hashed OTP, the
 * new password is stored, and every existing session is revoked so a stolen
 * session cannot survive the change.
 */
export const resetPassword = async ({ resetId, code, password }) => {
  const record = await requireValidResetCode({ resetId, code });

  const row = await findUserById(record.user_id);
  if (!row) {
    await deletePasswordReset(resetId);
    throw new AppError('This reset code is no longer valid. Please request a new one.', 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await updateUserPasswordHash(row.id, passwordHash);
  await deletePasswordReset(resetId);
  await revokeAllSessions(row.id);

  return { reset: true };
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
