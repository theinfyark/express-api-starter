import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { requestId } from './request-id.js';
import { createLogger } from './logger.js';
import { createJwtMiddleware } from './jwt.js';
import { errorHandler, notFoundHandler } from './error-handler.js';
import { mountHealth } from './health.js';

/**
 * @typedef {object} CreateServerOptions
 * @property {import('cors').CorsOptions | boolean} [cors]
 * @property {Parameters<typeof helmet>[0] | boolean} [helmet]
 * @property {boolean | import('express-rate-limit').Options} [rateLimit]
 * @property {boolean | { format?: string }} [logger]
 * @property {boolean | { path?: string }} [health]
 * @property {boolean} [json]
 * @property {string | import('express').RequestHandler} [jwt] Enable JWT globally (secret string) or pass custom middleware
 * @property {import('express').RequestHandler[]} [middleware] Extra middleware after built-ins
 * @property {boolean} [trustProxy]
 */

/**
 * Create an Express app pre-wired with production middleware.
 *
 * Enables by default: Helmet, CORS, JSON body parser, request id,
 * request logging, rate limiting, and `GET /health`.
 *
 * Mount `app.notFound()` and `app.errors()` after your routes
 * (or call `app.listen()` which wires them automatically).
 *
 * @param {CreateServerOptions} [options]
 * @returns {import('express').Express & {
 *   jwt: import('express').RequestHandler,
 *   notFound: () => void,
 *   errors: () => void,
 *   listen: (...args: Parameters<import('express').Express['listen']>) => ReturnType<import('express').Express['listen']>
 * }}
 *
 * @example
 * ```js
 * import { createServer } from "express-api-starter";
 *
 * const app = createServer();
 *
 * app.get("/hello", (req, res) => {
 *   res.json({ message: "Hello" });
 * });
 *
 * app.listen(3000);
 * ```
 */
export function createServer(options = {}) {
  const app = express();

  if (options.trustProxy) {
    app.set('trust proxy', 1);
  }

  // Security & parsing
  if (options.helmet !== false) {
    app.use(helmet(options.helmet === true ? undefined : options.helmet));
  }

  if (options.cors !== false) {
    app.use(cors(options.cors === true ? undefined : options.cors));
  }

  if (options.json !== false) {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
  }

  app.use(requestId());

  if (options.logger !== false) {
    const loggerOpts = options.logger === true ? {} : options.logger || {};
    app.use(createLogger(loggerOpts));
  }

  if (options.rateLimit !== false) {
    const limitOpts =
      typeof options.rateLimit === 'object' && options.rateLimit
        ? options.rateLimit
        : {
            windowMs: 15 * 60 * 1000,
            max: 100,
            standardHeaders: true,
            legacyHeaders: false,
          };
    app.use(rateLimit(limitOpts));
  }

  if (options.health !== false) {
    const healthOpts = options.health === true ? {} : options.health || {};
    mountHealth(app, healthOpts);
  }

  // JWT helper middleware always available as app.jwt
  const jwtMiddleware =
    typeof options.jwt === 'function'
      ? options.jwt
      : createJwtMiddleware({
          secret: typeof options.jwt === 'string' ? options.jwt : undefined,
        });

  if (typeof options.jwt === 'string' || options.jwt === true) {
    app.use(jwtMiddleware);
  }

  if (Array.isArray(options.middleware)) {
    for (const mw of options.middleware) app.use(mw);
  }

  let closed = false;

  app.jwt = jwtMiddleware;

  app.notFound = () => {
    app.use(notFoundHandler);
  };

  app.errors = () => {
    app.use(errorHandler());
  };

  const originalListen = app.listen.bind(app);
  app.listen = (...args) => {
    if (!closed) {
      app.notFound();
      app.errors();
      closed = true;
    }
    return originalListen(...args);
  };

  return app;
}
