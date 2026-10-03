import { Router } from 'express';
import { createApplication, getMyApplications } from '../controllers/applicationController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
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
