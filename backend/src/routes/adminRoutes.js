import { Router } from 'express';
import { changeRole, getAdminShelter, getAdminShelters, getAllPets, getStats, getUsers } from '../controllers/adminController.js';
import {
  approveApplication,
  getShelterApplications,
  rejectApplication,
  resendReviewEmail,
} from '../controllers/shelterApplicationController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { uuidParam } from '../validators/commonValidator.js';
import { updateUserRoleSchema } from '../validators/adminValidator.js';
import { reviewShelterApplicationSchema } from '../validators/shelterApplicationValidator.js';

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
adminRoutes.get('/shelters', getAdminShelters);
adminRoutes.get('/shelters/:id', validate(uuidParam, 'params'), getAdminShelter);

adminRoutes.get('/shelter-applications', getShelterApplications);
adminRoutes.patch(
  '/shelter-applications/:id/approve',
  validate(uuidParam, 'params'),
  approveApplication,
);
adminRoutes.patch(
  '/shelter-applications/:id/reject',
  validate(uuidParam, 'params'),
  validate(reviewShelterApplicationSchema),
  rejectApplication,
);
adminRoutes.patch(
  '/shelter-applications/:id/resend-email',
  validate(uuidParam, 'params'),
  resendReviewEmail,
);
