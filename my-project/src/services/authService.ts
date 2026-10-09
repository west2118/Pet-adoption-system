import { apiRequest, tokenStore } from '@/lib/apiClient';
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
    tokenStore.set(result.token);
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
  tokenStore.set(result.token);
  tokenStore.clearOnboarding();
  return result;
};

export const me = async (): Promise<User> => {
  const { user } = await apiRequest<{ user: User }>('/auth/me', { auth: 'full' });
  return user;
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
  updateMe,
  submitShelterApplication,
  getMyShelterApplication,
};
