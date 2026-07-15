# express-api-starter

Production-ready **Express API starter** — security, logging, validation, JWT, rate limiting, and health checks in one `createServer()` call.

```bash
npm install express-api-starter
```

## Quick start

```js
import { createServer } from 'express-api-starter';

const app = createServer();

app.get('/hello', (req, res) => {
  res.json({ message: 'Hello' });
});

app.listen(3000);
```

That’s enough for:

| Feature           | Default                   |
| ----------------- | ------------------------- |
| **Helmet**        | security headers          |
| **CORS**          | enabled                   |
| **Logger**        | morgan + request id       |
| **Request Id**    | `X-Request-Id` / `req.id` |
| **Rate Limiter**  | 100 req / 15 min          |
| **Health**        | `GET /health`             |
| **JSON body**     | `express.json()`          |
| **Error Handler** | wired on `listen()`       |
| **404 Handler**   | wired on `listen()`       |

## JWT

Protect individual routes:

```js
import { createServer, signToken } from 'express-api-starter';

const app = createServer();

app.post('/login', (req, res) => {
  const token = signToken(
    { id: 1, role: 'user' },
    { secret: process.env.JWT_SECRET },
  );
  res.json({ token });
});

app.get('/me', app.jwt, (req, res) => {
  res.json({ user: req.user });
});

app.listen(3000);
```

Set `JWT_SECRET` in the environment, or pass `{ jwt: "your-secret" }` / `createJwtMiddleware({ secret })`.

## Validation

```js
import { createServer, validate } from 'express-api-starter';

const app = createServer();

app.post(
  '/users',
  validate({
    email: { type: 'email', required: true },
    name: { type: 'string', min: 2, max: 80 },
    age: { type: 'number', min: 18, required: false },
  }),
  (req, res) => {
    res.status(201).json({ ok: true, body: req.body });
  },
);

app.listen(3000);
```

Failed validation returns `400` with `error.details`.

## Errors

```js
import { createServer, AppError } from 'express-api-starter';

const app = createServer();

app.get('/boom', () => {
  throw new AppError('Nope', 400);
});

app.listen(3000);
```

Response shape:

```json
{
  "success": false,
  "error": {
    "message": "Nope",
    "requestId": "…"
  }
}
```

## Options

```js
const app = createServer({
  cors: { origin: 'https://app.example.com' },
  helmet: true,
  logger: { format: 'tiny' },
  rateLimit: { windowMs: 60_000, max: 30 },
  health: { path: '/readyz' },
  jwt: false, // or a secret string to require JWT globally
  trustProxy: true, // behind nginx / load balancer
  middleware: [], // extra middleware after built-ins
});
```

Disable any piece with `false` (`cors`, `helmet`, `logger`, `rateLimit`, `health`, `json`).

## Exports

```js
import {
  createServer,
  AppError,
  validate,
  signToken,
  createJwtMiddleware,
  createLogger,
  requestId,
  errorHandler,
  notFoundHandler,
  mountHealth,
} from 'express-api-starter';
```

## Requirements

- Node.js 18+

## License

MIT
