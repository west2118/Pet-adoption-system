import { z } from 'zod';

export const uuidParam = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const paginationQuery = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('12'),
});

export const parsePagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit ?? '12', 10) || 12));
  return { page, limit, offset: (page - 1) * limit };
};
