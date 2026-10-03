import { AppError } from '../utils/AppError.js';

// Scopes staff actions to their assigned shelter.
// platform_admin may scope via ?shelterId=... query param.
export const requireShelter = (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }
  if (req.user.role === 'platform_admin') {
    const override = req.query.shelterId ?? req.body?.shelterId ?? req.headers['x-shelter-id'];
    if (!override) {
      return next(
        new AppError('shelterId scope is required for platform admin shelter operations.', 400),
      );
    }
    req.user = { ...req.user, shelterId: override };
    return next();
  }
  if (!req.user.shelterId) {
    return next(new AppError('No shelter assigned to this staff account.', 403));
  }
  return next();
};
