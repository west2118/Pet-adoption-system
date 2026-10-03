import { AppError } from '../utils/AppError.js';

export const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError('Forbidden. You do not have permission to perform this action.', 403));
  }
  return next();
};
