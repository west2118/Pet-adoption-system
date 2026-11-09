import { Router } from 'express';
import {
  addListing,
  deleteListing,
  deleteListings,
  editListing,
  getMyListings,
} from '../controllers/listingController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { requireShelter } from '../middlewares/requireShelter.js';
import { validate } from '../middlewares/validate.js';
import { bulkDeleteSchema, uuidParam } from '../validators/commonValidator.js';
import { createPetSchema, shelterListingQuerySchema, updatePetSchema } from '../validators/petValidator.js';

export const listingRoutes = Router();

listingRoutes.use(authenticate, authorize('shelter_staff', 'platform_admin'), requireShelter);

listingRoutes.get('/', validate(shelterListingQuerySchema, 'query'), getMyListings);
listingRoutes.post('/', validate(createPetSchema), addListing);
listingRoutes.patch(
  '/:id',
  validate(uuidParam, 'params'),
  validate(updatePetSchema),
  editListing,
);
listingRoutes.delete('/', validate(bulkDeleteSchema), deleteListings);
listingRoutes.delete('/:id', validate(uuidParam, 'params'), deleteListing);
