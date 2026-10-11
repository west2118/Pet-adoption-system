import { Router } from 'express';
import { getOverview } from '../controllers/overviewController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { requireShelter } from '../middlewares/requireShelter.js';

export const shelterOverviewRoutes = Router();

shelterOverviewRoutes.use(authenticate, authorize('shelter_staff', 'platform_admin'), requireShelter);

shelterOverviewRoutes.get('/', getOverview);
