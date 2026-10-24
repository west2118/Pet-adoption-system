import { Router } from 'express';
import {
  cancelMyVisit,
  createVisit,
  getMyVisitForPet,
  getMyVisitSummary,
  getMyVisits,
} from '../controllers/visitController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { uuidParam } from '../validators/commonValidator.js';
import {
  cancelVisitSchema,
  createVisitSchema,
  visitPetParam,
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
// Whether this adopter already requested a visit for a given pet. Kept ahead
// of any `/:id` route and scoped by pet so the one-request rule is visible
// on the pet page.
visitRoutes.get(
  '/my/pet/:petId',
  authenticate,
  authorize('adopter'),
  validate(visitPetParam, 'params'),
  getMyVisitForPet,
);
visitRoutes.patch(
  '/:id/cancel',
  authenticate,
  authorize('adopter'),
  validate(uuidParam, 'params'),
  validate(cancelVisitSchema),
  cancelMyVisit,
);
