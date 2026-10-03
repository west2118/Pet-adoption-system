import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const codeForStatus = (statusCode) => {
  if (statusCode === 400) return 'BAD_REQUEST';
  if (statusCode === 401) return 'UNAUTHORIZED';
  if (statusCode === 403) return 'FORBIDDEN';
  if (statusCode === 404) return 'NOT_FOUND';
  if (statusCode === 409) return 'CONFLICT';
  if (statusCode === 429) return 'RATE_LIMIT_EXCEEDED';
  return 'INTERNAL_SERVER_ERROR';
};

// Express 5 error middleware: (err, req, res, next)
export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: codeForStatus(err.statusCode),
        message: err.message,
      },
    });
  }
  if (err && (err.code === '23505' || err.statusCode === 409)) {
    return res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'Resource already exists.' },
    });
  }
  logger.error('Unexpected system error:', err);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error occurred.',
      ...(env.NODE_ENV === 'development' && err?.stack ? { stack: err.stack } : {}),
    },
  });
};

export const notFound = (_req, res) =>
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found.' },
  });
