import { Router } from 'express';
import {
  createShelterUser,
  deleteShelterUser,
  getShelterUsers,
  updateShelterUser,
} from '../controllers/shelterUserController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { requireShelter } from '../middlewares/requireShelter.js';
import { requireShelterAdmin } from '../middlewares/requireShelterAdmin.js';
import { validate } from '../middlewares/validate.js';
import { uuidParam } from '../validators/commonValidator.js';
import {
  createShelterUserSchema,
  updateShelterUserSchema,
} from '../validators/shelterUserValidator.js';

export const shelterUserRoutes = Router();

// Every route is scoped to the staff member's own shelter via the JWT.
shelterUserRoutes.use(
  authenticate,
  authorize('shelter_staff', 'platform_admin'),
  requireShelter,
);

shelterUserRoutes.get('/', getShelterUsers);
shelterUserRoutes.post(
  '/',
  requireShelterAdmin,
  validate(createShelterUserSchema),
  createShelterUser,
);
shelterUserRoutes.patch(
  '/:id',
  requireShelterAdmin,
  validate(uuidParam, 'params'),
  validate(updateShelterUserSchema),
  updateShelterUser,
);
shelterUserRoutes.delete(
  '/:id',
  requireShelterAdmin,
  validate(uuidParam, 'params'),
  deleteShelterUser,
);
