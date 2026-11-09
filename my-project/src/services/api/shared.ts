import { ApiError } from '@/lib/apiClient';
import type { Pet, Shelter } from '@/types';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  /** Total pages for the current filter set (backend-computed). */
  totalPages?: number;
}

/** Max rows fetched by the legacy non-paginated list helpers. */
export const PUBLIC_PAGE_LIMIT = 100;

export interface PetsListResponse {
  pets: Pet[];
}

export interface PetResponse {
  pet: Pet;
}

export interface SheltersListResponse {
  shelters: Shelter[];
}

export interface ShelterResponse {
  shelter: Shelter;
}

export const isNotFoundError = (err: unknown): boolean =>
  err instanceof ApiError && err.status === 404;
