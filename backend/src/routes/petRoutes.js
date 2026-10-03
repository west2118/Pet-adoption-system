import { Router } from 'express';
import { getPetById, listPets } from '../controllers/petController.js';
import { validate } from '../middlewares/validate.js';
import { petQuerySchema } from '../validators/petValidator.js';
import { uuidParam } from '../validators/commonValidator.js';

export const petRoutes = Router();

petRoutes.get('/', validate(petQuerySchema, 'query'), listPets);
petRoutes.get('/:id', validate(uuidParam, 'params'), getPetById);
