/**
 * Built-in health check route.
 *
 * @param {import('express').Express} app
 * @param {{ path?: string, handler?: import('express').RequestHandler }} [options]
 */
export function mountHealth(app, options = {}) {
  const path = options.path ?? '/health';

  const handler =
    options.handler ??
    ((_req, res) => {
      res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    });

  app.get(path, handler);
}
