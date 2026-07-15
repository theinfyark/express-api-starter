import { randomUUID } from 'node:crypto';

/**
 * Attach a unique request id (`req.id` + `X-Request-Id` header).
 * Reuses an inbound `X-Request-Id` when present.
 *
 * @returns {import('express').RequestHandler}
 */
export function requestId() {
  return (req, res, next) => {
    const incoming = req.headers['x-request-id'];
    const id =
      typeof incoming === 'string' && incoming.trim()
        ? incoming.trim()
        : randomUUID();

    req.id = id;
    res.setHeader('X-Request-Id', id);
    next();
  };
}
