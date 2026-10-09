import { apiRequest, sessionStore, tokenStore } from '@/lib/apiClient';
import type { ShelterApplication, User, UserRole } from '@/types';

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface SignupResult {
  user: User;
  token?: string;
  onboardingToken?: string;
  requiresOnboarding?: boolean;
}

export interface LoginResult {
  user: User;
  token: string;
}

export interface ShelterApplicationInput {
  name: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  operatingHours: string;
  description: string;
  imageUrl?: string;
}

export const signup = async (input: SignupInput): Promise<SignupResult> => {
  const result = await apiRequest<SignupResult>('/auth/signup', {
    method: 'POST',
    body: input,
  });
  if (result.token) {
    // Full session: JWTs live in httpOnly cookies now — only remember that a
    // session exists so backend-first reads survive reloads.
    sessionStore.mark();
    tokenStore.clearOnboarding();
  } else if (result.onboardingToken) {
    tokenStore.setOnboarding(result.onboardingToken);
  }
  return result;
};

export const login = async (email: string, password: string): Promise<LoginResult> => {
  const result = await apiRequest<LoginResult>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  sessionStore.mark();
  tokenStore.clearOnboarding();
  return result;
};

export const me = async (): Promise<User> => {
  const { user } = await apiRequest<{ user: User }>('/auth/me', { auth: 'full' });
  return user;
};

/** Rotates the session via the refresh cookie (used after access expiry). */
export const refreshSession = async (): Promise<User> => {
  const { user } = await apiRequest<{ user: User }>('/auth/refresh', { method: 'POST' });
  sessionStore.mark();
  return user;
};

/** Revokes the server session and clears cookies + the local session flag. */
export const logoutSession = async (): Promise<void> => {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } finally {
    sessionStore.clear();
    tokenStore.clearOnboarding();
  }
};

export interface UpdateProfileInput {
  name?: string;
  avatarUrl?: string | null;
}

export const updateMe = async (input: UpdateProfileInput): Promise<User> => {
  const { user } = await apiRequest<{ user: User }>('/auth/me', {
    method: 'PATCH',
    body: input,
    auth: 'full',
  });
  return user;
};

export const submitShelterApplication = async (
  input: ShelterApplicationInput,
): Promise<ShelterApplication> => {
  const { application } = await apiRequest<{ application: ShelterApplication }>(
    '/shelter-onboarding',
    { method: 'POST', body: input, auth: 'onboarding' },
  );
  return application;
};

export const getMyShelterApplication = async (): Promise<ShelterApplication | null> => {
  const { application } = await apiRequest<{ application: ShelterApplication | null }>(
    '/shelter-onboarding/mine',
    { auth: 'onboarding' },
  );
  return application;
};

export const authService = {
  signup,
  login,
  me,
  refreshSession,
  logoutSession,
  updateMe,
  submitShelterApplication,
  getMyShelterApplication,
};
