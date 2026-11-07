import { AppError } from '../utils/AppError.js';
import { findUserById } from '../repositories/userRepository.js';

/**
 * Restricts staff-account mutations to the shelter's owner/admin.
 * Regular staff can read the team list but cannot add, edit, or remove accounts.
 */
export const requireShelterAdmin = async (req, _res, next) => {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    if (req.user.role === 'platform_admin') {
      return next();
    }
    const account = await findUserById(req.user.id);
    if (!account || !account.is_owner) {
      return next(new AppError('Only shelter admins can manage staff accounts.', 403));
    }
    return next();
  } catch (err) {
    return next(err);
  }
};
