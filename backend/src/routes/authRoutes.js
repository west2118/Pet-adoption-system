import { Router } from 'express';
import { getCurrentUser, loginUser, logoutUser, refreshSession, signupUser, updateCurrentUser } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, signupSchema, updateProfileSchema } from '../validators/authValidator.js';

export const authRoutes = Router();

authRoutes.post('/signup', validate(signupSchema), signupUser);
authRoutes.post('/login', validate(loginSchema), loginUser);
authRoutes.post('/refresh', refreshSession);
authRoutes.post('/logout', logoutUser);
authRoutes.get('/me', authenticate, getCurrentUser);
authRoutes.patch('/me', authenticate, validate(updateProfileSchema), updateCurrentUser);
