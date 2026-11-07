import { apiRequest, apiRequestWithMeta } from '@/lib/apiClient';
import type { User, UserRole } from '@/types';

import type { PaginatedResult } from './shared';

export const listUsersPaginated = async (options: {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
} = {}): Promise<PaginatedResult<User>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (options.role && options.role !== 'all') queryParams.set('role', options.role);
  if (options.search) queryParams.set('search', options.search);

  const { data, meta } = await apiRequestWithMeta<{ users: User[] }>(
    `/admin/users?${queryParams.toString()}`,
    { auth: 'full' },
  );
  return {
    items: data.users,
    total: meta?.total ?? data.users.length,
    page: meta?.page ?? page,
    limit: meta?.limit ?? limit,
  };
};

/** The only user mutation the admin API exposes: changing an account's role. */
export const updateUserRole = async (
  id: string,
  role: UserRole,
  shelterId?: string,
): Promise<User> => {
  const { user } = await apiRequest<{ user: User }>(
    `/admin/users/${encodeURIComponent(id)}/role`,
    {
      method: 'PATCH',
      body: { role, ...(shelterId ? { shelterId } : {}) },
      auth: 'full',
    },
  );
  return user;
};

export const userService = {
  listPaginated: listUsersPaginated,
  updateRole: updateUserRole,
};
