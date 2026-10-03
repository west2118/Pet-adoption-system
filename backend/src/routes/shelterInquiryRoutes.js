import { Router } from 'express';
import { getShelterInquiries, markInquiryResolved } from '../controllers/inquiryController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { requireShelter } from '../middlewares/requireShelter.js';
import { validate } from '../middlewares/validate.js';
import { uuidParam } from '../validators/commonValidator.js';

export const shelterInquiryRoutes = Router();

shelterInquiryRoutes.use(
  authenticate,
  authorize('shelter_staff', 'platform_admin'),
  requireShelter,
);

shelterInquiryRoutes.get('/', getShelterInquiries);
shelterInquiryRoutes.patch(
  '/:id/resolve',
  validate(uuidParam, 'params'),
  markInquiryResolved,
);
