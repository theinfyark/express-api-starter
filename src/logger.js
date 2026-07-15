import morgan from 'morgan';

/**
 * HTTP request logger with request id token.
 *
 * @param {{ format?: string, skip?: (req: import('express').Request, res: import('express').Response) => boolean }} [options]
 * @returns {import('express').RequestHandler}
 */
export function createLogger(options = {}) {
  morgan.token('id', (req) => req.id || '-');

  const format =
    options.format ??
    ':id :remote-addr :method :url :status :res[content-length] - :response-time ms';

  return morgan(format, {
    skip: options.skip,
  });
}
