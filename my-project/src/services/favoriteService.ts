import { apiRequest } from '@/lib/apiClient';
import type { Pet } from '@/types';

export type ToggleFavoriteResult = 'added' | 'removed' | 'login-required' | 'error';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Demo catalogue ids (p1, p2…) fail the backend UUID validation. */
export const isServerPersistedPetId = (petId: string): boolean => UUID_RE.test(petId);

const cacheKey = (userId: string) => `paws:favorites:${userId}`;

export const readFavoritesCache = (userId: string): string[] => {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

export const writeFavoritesCache = (userId: string, ids: string[]) => {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(ids));
  } catch {
    // Storage full or unavailable — server remains the source of truth.
  }
};

/**
 * Adopter favorites API backed by the Express backend.
 *
 * - GET /favorites → the session user's saved pets
 * - POST /favorites/:petId → save (idempotent server-side)
 * - DELETE /favorites/:petId → remove
 *
 * All endpoints require a real session (`auth: 'full'`). Guests never reach
 * here — the favorites hook redirects them to /login first. Demo catalogue
 * ids (p1, p2…) fail the backend UUID validation, so the hook keeps those
 * in per-user localStorage instead of calling these functions.
 */
export const listMyFavorites = async (): Promise<Pet[]> => {
  const { pets } = await apiRequest<{ pets: Pet[] }>('/favorites', { auth: 'full' });
  return pets;
};

export const addFavoritePet = async (petId: string): Promise<void> => {
  await apiRequest(`/favorites/${encodeURIComponent(petId)}`, {
    method: 'POST',
    auth: 'full',
  });
};

export const removeFavoritePet = async (petId: string): Promise<void> => {
  await apiRequest(`/favorites/${encodeURIComponent(petId)}`, {
    method: 'DELETE',
    auth: 'full',
  });
};

export const favoriteService = {
  listMine: listMyFavorites,
  add: addFavoritePet,
  remove: removeFavoritePet,
};
