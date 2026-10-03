import { createListing, listShelterListings, removeListing, updateListing } from '../services/listingService.js';
import { sendSuccess, buildMeta } from '../utils/respond.js';
import { parsePagination } from '../validators/commonValidator.js';

export const getMyListings = async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { pets, total } = await listShelterListings(req.user.shelterId, { limit, offset });
  return sendSuccess(res, { pets }, undefined, buildMeta(page, limit, total));
};

export const addListing = async (req, res) => {
  const pet = await createListing(req.body, req.user.shelterId);
  return sendSuccess(res, { pet }, 'Pet listing created successfully.', undefined, 201);
};

export const editListing = async (req, res) => {
  const pet = await updateListing(req.params.id, req.body, req.user.shelterId);
  return sendSuccess(res, { pet }, 'Pet listing updated successfully.');
};

export const deleteListing = async (req, res) => {
  const result = await removeListing(req.params.id, req.user.shelterId);
  return sendSuccess(res, result, 'Pet listing removed successfully.');
};
