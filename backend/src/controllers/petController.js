import { getPublicPetFacets, getPublicPetById, getPublicPets } from '../services/petService.js';
import { sendSuccess, buildMeta } from '../utils/respond.js';
import { parsePagination } from '../validators/commonValidator.js';

const TRUTHY = new Set(['true', '1', 'yes', 'on']);

/** Parses an optional finite number from a query string, else undefined. */
const toNumber = (value) => {
  const parsed = Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const listPets = async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const latitude = toNumber(req.query.lat);
  const longitude = toNumber(req.query.lng);
  const radiusKm = toNumber(req.query.radiusKm);
  const hasOrigin =
    latitude !== undefined &&
    longitude !== undefined &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180;

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
    // Nearby mode: coordinates are required, radius/sort are optional.
    latitude: hasOrigin ? latitude : undefined,
    longitude: hasOrigin ? longitude : undefined,
    radiusKm:
      hasOrigin && radiusKm !== undefined && radiusKm > 0
        ? Math.min(radiusKm, 500)
        : undefined,
    sortByDistance: hasOrigin && req.query.sort === 'distance',
  };
  const { pets, total } = await getPublicPets(filters, { limit, offset });
  return sendSuccess(res, { pets }, undefined, buildMeta(page, limit, total));
};

/** Facet options + hero counts (optionally scoped to one shelter, no pagination needed). */
export const getPetFacets = async (req, res) => {
  const shelterId = req.query.shelterId || undefined;
  const facets = await getPublicPetFacets(shelterId);
  return sendSuccess(res, facets);
};

export const getPetById = async (req, res) => {
  const pet = await getPublicPetById(req.params.id);
  return sendSuccess(res, { pet });
};
