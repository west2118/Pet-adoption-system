import { apiRequest } from '@/lib/apiClient';
import type { ShelterApplication, User, UserRole } from '@/types';

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface SignupResult {
  user: User;
  requiresOnboarding?: boolean;
}

export interface LoginResult {
  user: User;
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

/**
 * The backend answers with the user and sets the session cookies itself
 * (httpOnly, so no token is ever readable here). A shelter signup instead
 * receives a pending account with an onboarding cookie and no portal access.
 */
export const signup = async (input: SignupInput): Promise<SignupResult> => {
  return apiRequest<SignupResult>('/auth/signup', {
    method: 'POST',
    body: input,
  });
};

export const login = async (email: string, password: string): Promise<LoginResult> => {
  return apiRequest<LoginResult>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
};

/** The backend session check: identity always comes from the authenticated API. */
export const me = async (): Promise<User> => {
  const { user } = await apiRequest<{ user: User }>('/auth/me', { auth: 'full' });
  return user;
};

/** Revokes the server session and clears the httpOnly cookies. */
export const logoutSession = async (): Promise<void> => {
  await apiRequest('/auth/logout', { method: 'POST' });
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
  logoutSession,
  updateMe,
  submitShelterApplication,
  getMyShelterApplication,
};
