import { Router } from 'express';
import {
  deleteInquiries,
  emailInquiry,
  getShelterInquiries,
  markInquiryResolved,
} from '../controllers/inquiryController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { requireShelter } from '../middlewares/requireShelter.js';
import { validate } from '../middlewares/validate.js';
import { bulkDeleteSchema, uuidParam } from '../validators/commonValidator.js';
import { sendInquiryEmailSchema } from '../validators/inquiryValidator.js';

export const shelterInquiryRoutes = Router();

shelterInquiryRoutes.use(
  authenticate,
  authorize('shelter_staff', 'platform_admin'),
  requireShelter,
);

shelterInquiryRoutes.get('/', getShelterInquiries);
shelterInquiryRoutes.delete('/', validate(bulkDeleteSchema), deleteInquiries);
shelterInquiryRoutes.patch(
  '/:id/resolve',
  validate(uuidParam, 'params'),
  markInquiryResolved,
);
shelterInquiryRoutes.post(
  '/:id/email',
  validate(uuidParam, 'params'),
  validate(sendInquiryEmailSchema),
  emailInquiry,
);
