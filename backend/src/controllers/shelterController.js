import { createShelter, getShelterById, getShelterStats as readShelterStats, listShelters, updateShelter } from '../services/shelterService.js';
import { sendSuccess, buildMeta } from '../utils/respond.js';
import { parsePagination } from '../validators/commonValidator.js';

export const getAllShelters = async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { shelters, total } = await listShelters({ limit, offset });
  return sendSuccess(res, { shelters }, undefined, buildMeta(page, limit, total));
};

/** Aggregates behind the shelters page header (list itself is paged at 10). */
export const getShelterStats = async (_req, res) => {
  const stats = await readShelterStats();
  return sendSuccess(res, { stats });
};

export const getShelter = async (req, res) => {
  const shelter = await getShelterById(req.params.id);
  return sendSuccess(res, { shelter });
};

export const addShelter = async (req, res) => {
  const shelter = await createShelter(req.body);
  return sendSuccess(res, { shelter }, 'Shelter registered successfully.', undefined, 201);
};

export const editShelter = async (req, res) => {
  const shelter = await updateShelter(req.params.id, req.body, req.user);
  return sendSuccess(res, { shelter }, 'Shelter updated successfully.');
};
