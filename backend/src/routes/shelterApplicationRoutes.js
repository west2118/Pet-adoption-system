import { Router } from 'express';
import { getShelterApplications, setApplicationStatus } from '../controllers/applicationController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { requireShelter } from '../middlewares/requireShelter.js';
import { validate } from '../middlewares/validate.js';
import { uuidParam } from '../validators/commonValidator.js';
import { updateApplicationStatusSchema } from '../validators/applicationValidator.js';

export const shelterApplicationRoutes = Router();

shelterApplicationRoutes.use(
  authenticate,
  authorize('shelter_staff', 'platform_admin'),
  requireShelter,
);

shelterApplicationRoutes.get('/', getShelterApplications);
shelterApplicationRoutes.patch(
  '/:id/status',
  validate(uuidParam, 'params'),
  validate(updateApplicationStatusSchema),
  setApplicationStatus,
);
