import { ZodError } from 'zod';

export const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const parsed = schema.parse(req[source]);
    // Express 5 exposes `req.query` / `req.params` as getter-only accessors,
    // so a plain assignment throws `Cannot set property query ...`.
    // Define the validated value as an own property instead.
    if (source === 'query' || source === 'params') {
      Object.defineProperty(req, source, {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      req[source] = parsed;
    }
    return next();
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request input parameters.',
          details,
        },
      });
    }
    return next(err);
  }
};
