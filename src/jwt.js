import jwt from 'jsonwebtoken';
import { AppError } from './errors.js';

/**
 * Create a JWT auth middleware.
 *
 * Reads `Authorization: Bearer <token>` (or optional cookie / query).
 * On success sets `req.user` to the decoded payload.
 *
 * @param {{
 *   secret?: string,
 *   algorithms?: string[],
 *   optional?: boolean,
 *   getToken?: (req: import('express').Request) => string | null | undefined
 * }} [options]
 * @returns {import('express').RequestHandler}
 */
export function createJwtMiddleware(options = {}) {
  const secret = options.secret ?? process.env.JWT_SECRET;
  const algorithms = options.algorithms ?? ['HS256'];
  const optional = options.optional === true;

  /**
   * @param {import('express').Request} req
   */
  const defaultGetToken = (req) => {
    const header = req.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7).trim();
    }
    return null;
  };

  const getToken = options.getToken ?? defaultGetToken;

  return (req, _res, next) => {
    const token = getToken(req);

    if (!token) {
      if (optional) return next();
      return next(new AppError('Missing authentication token', 401));
    }

    if (!secret) {
      return next(
        new AppError(
          'JWT secret is not configured. Pass secret or set JWT_SECRET.',
          500,
        ),
      );
    }

    try {
      req.user = jwt.verify(token, secret, { algorithms });
      return next();
    } catch {
      return next(new AppError('Invalid or expired authentication token', 401));
    }
  };
}

/**
 * Sign a JWT.
 *
 * @param {object} payload
 * @param {{ secret?: string, expiresIn?: string | number }} [options]
 * @returns {string}
 */
export function signToken(payload, options = {}) {
  const secret = options.secret ?? process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError(
      'JWT secret is not configured. Pass secret or set JWT_SECRET.',
      500,
    );
  }
  return jwt.sign(payload, secret, {
    expiresIn: options.expiresIn ?? '1d',
  });
}
