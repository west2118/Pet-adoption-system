import { AppError } from '../utils/AppError.js';

// Allows a shelter registrant to use their limited onboarding token (or an already
// approved shelter staff token) on onboarding-only endpoints.
/**
 * Portal endpoints (e.g. `/auth/me`) need a real session: the limited
 * onboarding token only unlocks the shelter-registration flow.
 */
export const requirePortalSession = (req, _res, next) => {
  if (req.user?.scope === 'onboarding') {
    return next(
      new AppError('Complete your shelter onboarding before accessing the portal.', 403),
    );
  }
  return next();
};

export const authorizeOnboarding = (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }
  if (req.user.role !== 'shelter_staff') {
    return next(new AppError('Forbidden. Only shelter accounts can submit onboarding.', 403));
  }
  return next();
};

export const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }
  // Pending registrants hold a limited onboarding token with no portal access.
  if (req.user.scope === 'onboarding') {
    return next(
      new AppError('Complete your shelter onboarding before accessing the portal.', 403),
    );
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError('Forbidden. You do not have permission to perform this action.', 403));
  }
  return next();
};
