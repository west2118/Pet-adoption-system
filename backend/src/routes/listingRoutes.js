import { Router } from 'express';
import { addListing, deleteListing, editListing, getMyListings } from '../controllers/listingController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { requireShelter } from '../middlewares/requireShelter.js';
import { validate } from '../middlewares/validate.js';
import { uuidParam } from '../validators/commonValidator.js';
import { createPetSchema, updatePetSchema } from '../validators/petValidator.js';

export const listingRoutes = Router();

listingRoutes.use(authenticate, authorize('shelter_staff', 'platform_admin'), requireShelter);

listingRoutes.get('/', getMyListings);
listingRoutes.post('/', validate(createPetSchema), addListing);
listingRoutes.patch(
  '/:id',
  validate(uuidParam, 'params'),
  validate(updatePetSchema),
  editListing,
);
listingRoutes.delete('/:id', validate(uuidParam, 'params'), deleteListing);
