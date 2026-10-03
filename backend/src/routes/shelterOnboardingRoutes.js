import { Router } from 'express';
import {
  createShelterApplication,
  getMyApplication,
} from '../controllers/shelterApplicationController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorizeOnboarding } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { createShelterApplicationSchema } from '../validators/shelterApplicationValidator.js';

export const shelterOnboardingRoutes = Router();

shelterOnboardingRoutes.use(authenticate, authorizeOnboarding);

shelterOnboardingRoutes.post(
  '/',
  validate(createShelterApplicationSchema),
  createShelterApplication,
);
shelterOnboardingRoutes.get('/mine', getMyApplication);
