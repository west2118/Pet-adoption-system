import { addFavoritePet, listMyFavorites, removeFavoritePet } from '../services/favoriteService.js';
import { sendSuccess } from '../utils/respond.js';

export const getMyFavorites = async (req, res) => {
  const pets = await listMyFavorites(req.user.id);
  return sendSuccess(res, { pets });
};

export const addFavorite = async (req, res) => {
  const pet = await addFavoritePet(req.user.id, req.params.petId);
  return sendSuccess(res, { pet }, 'Added to favorites.', undefined, 201);
};

export const removeFavorite = async (req, res) => {
  const result = await removeFavoritePet(req.user.id, req.params.petId);
  return sendSuccess(res, result, 'Removed from favorites.');
};
