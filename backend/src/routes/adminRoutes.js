import { Router } from 'express';
import { changeRole, getAllPets, getStats, getUsers } from '../controllers/adminController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { uuidParam } from '../validators/commonValidator.js';
import { updateUserRoleSchema } from '../validators/adminValidator.js';

export const adminRoutes = Router();

adminRoutes.use(authenticate, authorize('platform_admin'));

adminRoutes.get('/stats', getStats);
adminRoutes.get('/users', getUsers);
adminRoutes.patch(
  '/users/:id/role',
  validate(uuidParam, 'params'),
  validate(updateUserRoleSchema),
  changeRole,
);
adminRoutes.get('/pets', getAllPets);
