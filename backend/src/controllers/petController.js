import { getPublicPetFacets, getPublicPetById, getPublicPets } from '../services/petService.js';
import { sendSuccess, buildMeta } from '../utils/respond.js';
import { parsePagination } from '../validators/commonValidator.js';

const TRUTHY = new Set(['true', '1', 'yes', 'on']);

export const listPets = async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const filters = {
    search: req.query.search || undefined,
    species: req.query.species || undefined,
    breed: req.query.breed || undefined,
    ageGroup: req.query.ageGroup || undefined,
    size: req.query.size || undefined,
    gender: req.query.gender || undefined,
    status: req.query.status || undefined,
    shelterId: req.query.shelterId || undefined,
    temperament: req.query.temperament || undefined,
    location: req.query.location || undefined,
    excludeAdopted: TRUTHY.has(String(req.query.excludeAdopted).toLowerCase()),
  };
  const { pets, total } = await getPublicPets(filters, { limit, offset });
  return sendSuccess(res, { pets }, undefined, buildMeta(page, limit, total));
};

/** Facet options + hero counts for the browse page (no pagination needed). */
export const getPetFacets = async (_req, res) => {
  const facets = await getPublicPetFacets();
  return sendSuccess(res, facets);
};

export const getPetById = async (req, res) => {
  const pet = await getPublicPetById(req.params.id);
  return sendSuccess(res, { pet });
};
