import { Router } from 'express';
import { createApplication, getMyApplications } from '../controllers/applicationController.js';
import { getMyApplicationWaiver } from '../controllers/waiverController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { uuidParam } from '../validators/commonValidator.js';
import { createApplicationSchema } from '../validators/applicationValidator.js';

export const applicationRoutes = Router();

applicationRoutes.post(
  '/',
  authenticate,
  authorize('adopter'),
  validate(createApplicationSchema),
  createApplication,
);
applicationRoutes.get(
  '/my',
  authenticate,
  authorize('adopter'),
  getMyApplications,
);
applicationRoutes.get(
  '/:id/waiver',
  authenticate,
  authorize('adopter'),
  validate(uuidParam, 'params'),
  getMyApplicationWaiver,
);
