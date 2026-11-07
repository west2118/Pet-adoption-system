import { apiRequest, apiRequestWithMeta } from '@/lib/apiClient';
import type { User } from '@/types';

import type { PaginatedResult } from './shared';

export type ShelterAccountType = 'admin' | 'staff';

export interface CreateShelterUserInput {
  name: string;
  email: string;
  password: string;
  accountType: ShelterAccountType;
}

export interface UpdateShelterUserInput {
  name?: string;
  email?: string;
  password?: string;
  accountType?: ShelterAccountType;
}

/**
 * One page of the signed-in shelter's staff/admin accounts. The backend scopes
 * rows to the staff member's shelter via the JWT, so no shelter id is sent.
 */
export const listShelterUsersPaginated = async (options: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<PaginatedResult<User>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (options.search) queryParams.set('search', options.search);

  const { data, meta } = await apiRequestWithMeta<{ users: User[] }>(
    `/shelter/users?${queryParams.toString()}`,
    { auth: 'full' },
  );
  return {
    items: data.users,
    total: meta?.total ?? data.users.length,
    page: meta?.page ?? page,
    limit: meta?.limit ?? limit,
  };
};

export const createShelterUser = async (
  input: CreateShelterUserInput,
): Promise<User> => {
  const result = await apiRequest<{ user: User }>('/shelter/users', {
    method: 'POST',
    auth: 'full',
    body: {
      name: input.name,
      email: input.email,
      password: input.password,
      accountType: input.accountType,
    },
  });
  return result.user;
};

export const updateShelterUser = async (
  id: string,
  input: UpdateShelterUserInput,
): Promise<User> => {
  const body: UpdateShelterUserInput = {
    name: input.name,
    email: input.email,
    accountType: input.accountType,
    ...(input.password ? { password: input.password } : {}),
  };
  const result = await apiRequest<{ user: User }>(
    `/shelter/users/${encodeURIComponent(id)}`,
    { method: 'PATCH', auth: 'full', body },
  );
  return result.user;
};

export const removeShelterUser = async (id: string): Promise<void> => {
  await apiRequest(`/shelter/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: 'full',
  });
};

export const shelterUserService = {
  list: listShelterUsersPaginated,
  create: createShelterUser,
  update: updateShelterUser,
  remove: removeShelterUser,
};
