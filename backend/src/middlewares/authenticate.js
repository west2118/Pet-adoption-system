import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { ACCESS_COOKIE, getCookie } from '../services/sessionService.js';

const bearerToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return undefined;
  return authHeader.split(' ')[1] || undefined;
};

/**
 * Access tokens travel in the `paws_at` httpOnly cookie (set on login);
 * the Authorization header still works as a fallback for API clients.
 */
export const authenticate = (req, _res, next) => {
  const token = getCookie(req, ACCESS_COOKIE) ?? bearerToken(req);
  if (!token) {
    return next(new AppError('Authentication required. Missing token.', 401));
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      shelterId: decoded.shelterId,
      scope: decoded.scope,
    };
    return next();
  } catch (_err) {
    return next(new AppError('Invalid or expired authentication token.', 401));
  }
};

export const optionalAuthenticate = (req, _res, next) => {
  const token = getCookie(req, ACCESS_COOKIE) ?? bearerToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      shelterId: decoded.shelterId,
    };
  } catch (_err) {
    // ignore invalid optional token; route stays public
  }
  return next();
};
