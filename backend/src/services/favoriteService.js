import { AppError } from '../utils/AppError.js';
import { mapPet } from '../utils/mappers.js';
import {
  addFavorite,
  listFavoritesByUser,
  removeFavorite,
} from '../repositories/favoriteRepository.js';
import { findPetById } from '../repositories/petRepository.js';

export const listMyFavorites = async (userId) => {
  const rows = await listFavoritesByUser(userId);
  return rows.map((r) => mapPet(r));
};

export const addFavoritePet = async (userId, petId) => {
  const pet = await findPetById(petId);
  if (!pet || pet.visibility !== 'public') {
    throw new AppError('Pet not found or not publicly available.', 404);
  }
  const row = await addFavorite(userId, petId);
  return mapPet(row);
};

export const removeFavoritePet = async (userId, petId) => {
  await removeFavorite(userId, petId);
  return { petId };
};
