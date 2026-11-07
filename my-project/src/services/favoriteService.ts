import { apiRequest } from '@/lib/apiClient';
import type { Pet } from '@/types';

export type ToggleFavoriteResult = 'added' | 'removed' | 'login-required' | 'error';

/**
 * Adopter favorites API backed by the Express backend.
 *
 * - GET /favorites → the session user's saved pets
 * - POST /favorites/:petId → save (idempotent server-side)
 * - DELETE /favorites/:petId → remove
 *
 * All endpoints require a real session (`auth: 'full'`); guests never reach
 * here because the favorites hook sends them to /login first.
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
