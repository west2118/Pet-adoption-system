import { Router } from 'express';
import { getPetById, getPetFacets, listPets } from '../controllers/petController.js';
import { validate } from '../middlewares/validate.js';
import { petQuerySchema } from '../validators/petValidator.js';
import { uuidParam } from '../validators/commonValidator.js';

export const petRoutes = Router();

petRoutes.get('/', validate(petQuerySchema, 'query'), listPets);
// Registered before /:id so `facets` is never treated as a pet UUID.
petRoutes.get('/facets', getPetFacets);
petRoutes.get('/:id', validate(uuidParam, 'params'), getPetById);
