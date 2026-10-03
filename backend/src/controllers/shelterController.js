import { createShelter, getShelterById, listShelters, updateShelter } from '../services/shelterService.js';
import { sendSuccess, buildMeta } from '../utils/respond.js';
import { parsePagination } from '../validators/commonValidator.js';

export const getAllShelters = async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { shelters, total } = await listShelters({ limit, offset });
  return sendSuccess(res, { shelters }, undefined, buildMeta(page, limit, total));
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
