import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export const authenticate = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Missing token.', 401));
  }
  const token = authHeader.split(' ')[1];
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
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
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
