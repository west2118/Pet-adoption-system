import { Router } from 'express';
import { getCurrentUser, loginUser, signupUser, updateCurrentUser } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { loginSchema, signupSchema, updateProfileSchema } from '../validators/authValidator.js';

export const authRoutes = Router();

authRoutes.post('/signup', authLimiter, validate(signupSchema), signupUser);
authRoutes.post('/login', authLimiter, validate(loginSchema), loginUser);
authRoutes.get('/me', authenticate, getCurrentUser);
authRoutes.patch('/me', authenticate, validate(updateProfileSchema), updateCurrentUser);
