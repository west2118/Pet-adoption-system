import { Router } from 'express';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshSession,
  requestPasswordResetHandler,
  resetPasswordHandler,
  verifyResetCodeHandler,
  resendOtpHandler,
  resendSignupOtpHandler,
  signupUser,
  updateCurrentUser,
  verifyOtpHandler,
  verifySignupOtpHandler,
} from '../controllers/authController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requirePortalSession } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  verifyResetCodeSchema,
  resendOtpSchema,
  resendSignupOtpSchema,
  signupSchema,
  updateProfileSchema,
  verifyOtpSchema,
  verifySignupOtpSchema,
} from '../validators/authValidator.js';

export const authRoutes = Router();

authRoutes.post('/signup', validate(signupSchema), signupUser);
authRoutes.post('/verify-signup-otp', validate(verifySignupOtpSchema), verifySignupOtpHandler);
authRoutes.post('/resend-signup-otp', validate(resendSignupOtpSchema), resendSignupOtpHandler);
authRoutes.post('/login', validate(loginSchema), loginUser);
authRoutes.post('/verify-otp', validate(verifyOtpSchema), verifyOtpHandler);
authRoutes.post('/resend-otp', validate(resendOtpSchema), resendOtpHandler);
authRoutes.post('/forgot-password', validate(forgotPasswordSchema), requestPasswordResetHandler);
authRoutes.post('/verify-reset-code', validate(verifyResetCodeSchema), verifyResetCodeHandler);
authRoutes.post('/reset-password', validate(resetPasswordSchema), resetPasswordHandler);
authRoutes.post('/refresh', refreshSession);
authRoutes.post('/logout', logoutUser);
authRoutes.get('/me', authenticate, requirePortalSession, getCurrentUser);
authRoutes.patch(
  '/me',
  authenticate,
  requirePortalSession,
  validate(updateProfileSchema),
  updateCurrentUser,
);
