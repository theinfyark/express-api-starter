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

## Introduction

**express-api-starter** helps you ship reliable Node.js / TypeScript applications with a small, focused API.

## Why this package exists

Popular stacks need small, trustworthy utilities with excellent DX. **express-api-starter** exists to solve one problem well: clear APIs, strong typing, minimal dependencies, and production-ready defaults — without the overhead of larger frameworks.

## Installation

```bash
npm install express-api-starter
# or
pnpm add express-api-starter
yarn add express-api-starter
```

Requires Node.js 18+.

## API Reference

See the exports from `express-api-starter` and the inline TypeScript types for the full surface area. Primary entry points are documented in **Quick Start** and **Examples** above.

## Examples

Minimal usage is shown in **Quick Start**. Prefer copying those snippets first, then expand into your app’s error handling and configuration patterns.

## Advanced Examples

- Combine with environment validation, logging, and health checks in production services
- Prefer dependency injection / custom `fetch` / client injection in tests
- Keep configuration explicit; avoid hidden global state

## Framework Integration

Works with Express, Fastify, Hono, NestJS, and plain Node HTTP servers. Import ESM (or CJS where published) and call the documented APIs from route handlers, middleware, or background jobs.

## TypeScript Usage

```ts
import { /* symbols */ } from "express-api-starter";
```

Types ship with the package (`types` / `exports.types`). Enable `strict` in your `tsconfig` for the best DX.

## Error Handling

- Fail fast with typed / named errors where provided
- Never swallow errors silently in production paths
- Prefer returning structured error payloads in HTTP layers
- Surface actionable messages (what failed + how to fix)

## Performance

- Minimal runtime work on the hot path
- Avoid unnecessary allocations and dependencies
- Tree-shakeable ESM entry points
- Prefer streaming / lazy work when dealing with large payloads

## Best Practices

- Pin major versions with SemVer ranges you trust
- Validate configuration at process startup
- Add health checks and observability around I/O
- Write tests for failure modes (timeouts, bad input, missing credentials)

## FAQ

**Does it work with ESM and CommonJS?**  
Yes where the package publishes dual exports. Prefer ESM for new projects.

**Is it production-ready?**  
Yes — tests, types, and SemVer releases are part of the maintenance model.

**How do I report a bug?**  
Open a GitHub issue using the bug template.

## Migration Guide

### From 0.x / early drafts
This package follows SemVer. Breaking changes land in major releases and are called out in `CHANGELOG.md`.

### Upgrading patch/minor
Patch and minor releases are backward compatible. Run your test suite after upgrading.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `ERR_MODULE_NOT_FOUND` | Wrong Node version / bad import path | Use Node 18+ and package `exports` |
| Types not resolving | Old moduleResolution | Use `bundler` or `node16`+ |
| Auth / network failures | Missing env or blocked egress | Check credentials and firewall |
| Unexpected runtime errors | Invalid input | Validate options; read error message |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). PRs with tests and docs are welcome.

