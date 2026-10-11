import { Router } from 'express';
import { cancelMyVisit, createVisit, getMyVisitSummary, getMyVisits, getVisit, postMessage } from '../controllers/visitController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { uuidParam } from '../validators/commonValidator.js';
import {
  cancelVisitSchema,
  createVisitMessageSchema,
  createVisitSchema,
} from '../validators/visitValidator.js';

export const visitRoutes = Router();

visitRoutes.post(
  '/',
  authenticate,
  authorize('adopter'),
  validate(createVisitSchema),
  createVisit,
);
visitRoutes.get('/my', authenticate, authorize('adopter'), getMyVisits);
// Summary counters for the same adopter — registered alongside /my so the
// paged list and the stats band can be fetched independently.
visitRoutes.get('/my/stats', authenticate, authorize('adopter'), getMyVisitSummary);
visitRoutes.get(
  '/:id',
  authenticate,
  authorize('adopter', 'shelter_staff', 'platform_admin'),
  validate(uuidParam, 'params'),
  getVisit,
);
visitRoutes.post(
  '/:id/messages',
  authenticate,
  authorize('adopter'),
  validate(uuidParam, 'params'),
  validate(createVisitMessageSchema),
  postMessage,
);
visitRoutes.patch(
  '/:id/cancel',
  authenticate,
  authorize('adopter'),
  validate(uuidParam, 'params'),
  validate(cancelVisitSchema),
  cancelMyVisit,
);
