import { Router } from 'express';
import { createInquiry, getMyInquiryForPet } from '../controllers/inquiryController.js';
import { authenticate, optionalAuthenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { visitPetParam } from '../validators/visitValidator.js';
import { validate } from '../middlewares/validate.js';
import { createInquirySchema } from '../validators/inquiryValidator.js';

export const inquiryRoutes = Router();

inquiryRoutes.get('/my/pet/:petId', authenticate, authorize('adopter'),
  validate(visitPetParam, 'params'), getMyInquiryForPet);

inquiryRoutes.post(
  '/',
  optionalAuthenticate,
  validate(createInquirySchema),
  createInquiry,
);
