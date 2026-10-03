import { Router } from 'express';
import { createInquiry } from '../controllers/inquiryController.js';
import { optionalAuthenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { createInquirySchema } from '../validators/inquiryValidator.js';

export const inquiryRoutes = Router();

inquiryRoutes.post(
  '/',
  optionalAuthenticate,
  validate(createInquirySchema),
  createInquiry,
);
