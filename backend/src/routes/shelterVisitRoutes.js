import { Router } from 'express';
import {
  deleteShelterVisitsHandler,
  getShelterVisit,
  getShelterVisits,
  updateVisitStatus,
} from '../controllers/shelterVisitController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { requireShelter } from '../middlewares/requireShelter.js';
import { validate } from '../middlewares/validate.js';
import { bulkDeleteSchema, uuidParam } from '../validators/commonValidator.js';
import { updateVisitStatusSchema } from '../validators/visitValidator.js';

export const shelterVisitRoutes = Router();

shelterVisitRoutes.use(
  authenticate,
  authorize('shelter_staff', 'platform_admin'),
  requireShelter,
);

shelterVisitRoutes.get('/', getShelterVisits);
shelterVisitRoutes.delete('/', validate(bulkDeleteSchema), deleteShelterVisitsHandler);
shelterVisitRoutes.get('/:id', validate(uuidParam, 'params'), getShelterVisit);
shelterVisitRoutes.patch(
  '/:id/status',
  validate(uuidParam, 'params'),
  validate(updateVisitStatusSchema),
  updateVisitStatus,
);
