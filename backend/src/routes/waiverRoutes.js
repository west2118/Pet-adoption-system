import { Router } from 'express';
import {
  addWaiverTemplate,
  editWaiverTemplate,
  generateApplicationWaiver,
  getApplicationWaiver,
  getWaiverById,
  getWaiverTemplates,
} from '../controllers/waiverController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { requireShelter } from '../middlewares/requireShelter.js';
import { validate } from '../middlewares/validate.js';
import { uuidParam } from '../validators/commonValidator.js';
import {
  createWaiverTemplateSchema,
  generateWaiverSchema,
  updateWaiverTemplateSchema,
} from '../validators/waiverValidator.js';

// All routes are shelter-scoped: staff only ever see their own shelter's
// templates and waivers (same pattern as /shelter/listings).
export const waiverRoutes = Router();

waiverRoutes.use(authenticate, authorize('shelter_staff', 'platform_admin'), requireShelter);

waiverRoutes.get('/waiver-templates', getWaiverTemplates);
waiverRoutes.post('/waiver-templates', validate(createWaiverTemplateSchema), addWaiverTemplate);
waiverRoutes.patch(
  '/waiver-templates/:id',
  validate(uuidParam, 'params'),
  validate(updateWaiverTemplateSchema),
  editWaiverTemplate,
);

waiverRoutes.post(
  '/applications/:id/waiver',
  validate(uuidParam, 'params'),
  validate(generateWaiverSchema),
  generateApplicationWaiver,
);
waiverRoutes.get(
  '/applications/:id/waiver',
  validate(uuidParam, 'params'),
  getApplicationWaiver,
);
waiverRoutes.get('/waivers/:id', validate(uuidParam, 'params'), getWaiverById);
