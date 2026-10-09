import { Router } from 'express';
import { addShelter, editShelter, getAllShelters, getShelter, getShelterStats } from '../controllers/shelterController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { uuidParam } from '../validators/commonValidator.js';
import { createShelterSchema, updateShelterSchema } from '../validators/shelterValidator.js';

export const shelterRoutes = Router();

shelterRoutes.get('/', getAllShelters);
// Registered before /:id so `stats` is never validated as a shelter UUID.
shelterRoutes.get('/stats', getShelterStats);
shelterRoutes.get('/:id', validate(uuidParam, 'params'), getShelter);
shelterRoutes.post(
  '/',
  authenticate,
  authorize('platform_admin'),
  validate(createShelterSchema),
  addShelter,
);
shelterRoutes.patch(
  '/:id',
  authenticate,
  authorize('shelter_staff', 'platform_admin'),
  validate(uuidParam, 'params'),
  validate(updateShelterSchema),
  editShelter,
);
