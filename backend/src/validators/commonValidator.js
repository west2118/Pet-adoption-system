import { z } from 'zod';

export const uuidParam = z.object({
  id: z.string().uuid('Invalid ID format'),
});

/** IDs sent by the shelter tables' bulk-delete selections. */
export const bulkDeleteSchema = z.object({
  ids: z
    .array(z.string().uuid('Invalid ID format'))
    .min(1, 'Select at least one item')
    .max(150, 'Too many items selected'),
});

export const paginationQuery = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
});

/**
 * Reads `page` / `limit` off a query object.
 *
 * The page size always comes from the backend: `defaultLimit` is what a
 * caller gets when it does not send one (10 everywhere, except endpoints
 * that opt into a smaller default). An explicit value is clamped to 1..100.
 */
export const parsePagination = (query, defaultLimit = 10) => {
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
  const requested = Number.parseInt(query.limit ?? String(defaultLimit), 10) || defaultLimit;
  const limit = Math.min(100, Math.max(1, requested));
  return { page, limit, offset: (page - 1) * limit };
};
