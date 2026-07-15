import { AppError } from './errors.js';

/**
 * 404 handler — mount after routes.
 * @type {import('express').RequestHandler}
 */
export function notFoundHandler(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

/**
 * Central JSON error handler — mount last.
 *
 * @param {{ includeStack?: boolean }} [options]
 * @returns {import('express').ErrorRequestHandler}
 */
export function errorHandler(options = {}) {
  const includeStack =
    options.includeStack ?? process.env.NODE_ENV !== 'production';

  return (err, req, res, _next) => {
    const status =
      typeof err.statusCode === 'number'
        ? err.statusCode
        : typeof err.status === 'number'
          ? err.status
          : 500;

    const message =
      status >= 500 && process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message || 'Internal Server Error';

    /** @type {Record<string, unknown>} */
    const body = {
      success: false,
      error: {
        message,
        ...(err.details !== undefined ? { details: err.details } : {}),
        ...(req.id ? { requestId: req.id } : {}),
      },
    };

    if (includeStack && err.stack && status >= 500) {
      body.error.stack = err.stack;
    }

    if (status >= 500) {
      console.error(`[${req.id ?? '-'}]`, err);
    }

    res.status(status).json(body);
  };
}
