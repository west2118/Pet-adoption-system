import { Router } from 'express';
import { addFavorite, getMyFavorites, removeFavorite } from '../controllers/favoriteController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { favoriteParamsSchema } from '../validators/adminValidator.js';

export const favoriteRoutes = Router();

favoriteRoutes.use(authenticate, authorize('adopter', 'shelter_staff', 'platform_admin'));

favoriteRoutes.get('/', getMyFavorites);
favoriteRoutes.post('/:petId', validate(favoriteParamsSchema, 'params'), addFavorite);
favoriteRoutes.delete(
  '/:petId',
  validate(favoriteParamsSchema, 'params'),
  removeFavorite,
);
