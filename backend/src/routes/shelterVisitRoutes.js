import { Router } from 'express';
import {
  getShelterVisit,
  getShelterVisits,
  postShelterMessage,
  updateVisitStatus,
} from '../controllers/shelterVisitController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { requireShelter } from '../middlewares/requireShelter.js';
import { validate } from '../middlewares/validate.js';
import { uuidParam } from '../validators/commonValidator.js';
import {
  createVisitMessageSchema,
  updateVisitStatusSchema,
} from '../validators/visitValidator.js';

export const shelterVisitRoutes = Router();

shelterVisitRoutes.use(
  authenticate,
  authorize('shelter_staff', 'platform_admin'),
  requireShelter,
);

shelterVisitRoutes.get('/', getShelterVisits);
shelterVisitRoutes.get('/:id', validate(uuidParam, 'params'), getShelterVisit);
shelterVisitRoutes.post(
  '/:id/messages',
  validate(uuidParam, 'params'),
  validate(createVisitMessageSchema),
  postShelterMessage,
);
shelterVisitRoutes.patch(
  '/:id/status',
  validate(uuidParam, 'params'),
  validate(updateVisitStatusSchema),
  updateVisitStatus,
);
