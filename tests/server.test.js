import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createServer, AppError, validate, signToken } from '../src/index.js';

describe('createServer', () => {
  /** @type {import('express').Express} */
  let app;

  before(() => {
    process.env.JWT_SECRET = 'test-secret';
    app = createServer({
      logger: false,
      rateLimit: false,
    });

    app.get('/hello', (req, res) => {
      res.json({ message: 'Hello', requestId: req.id });
    });

    app.get('/secure', app.jwt, (req, res) => {
      res.json({ user: req.user });
    });

    app.post(
      '/users',
      validate({
        email: { type: 'email', required: true },
        name: { type: 'string', min: 2 },
      }),
      (req, res) => {
        res.status(201).json({ ok: true });
      },
    );

    app.get('/fail', () => {
      throw new AppError('Bad things', 400, { code: 'BAD' });
    });

    // Wire 404 + errors without listening
    app.notFound();
    app.errors();
  });

  it('responds on /hello and sets request id', async () => {
    const res = await request(app).get('/hello').expect(200);
    assert.equal(res.body.message, 'Hello');
    assert.ok(res.headers['x-request-id']);
    assert.equal(res.body.requestId, res.headers['x-request-id']);
  });

  it('exposes /health', async () => {
    const res = await request(app).get('/health').expect(200);
    assert.equal(res.body.status, 'ok');
    assert.ok(typeof res.body.uptime === 'number');
  });

  it('returns security headers via helmet', async () => {
    const res = await request(app).get('/hello').expect(200);
    assert.ok(res.headers['x-content-type-options']);
  });

  it('validates request bodies', async () => {
    const bad = await request(app)
      .post('/users')
      .send({ name: 'A' })
      .expect(400);
    assert.equal(bad.body.success, false);
    assert.ok(Array.isArray(bad.body.error.details));

    await request(app)
      .post('/users')
      .send({ email: 'a@b.com', name: 'Ann' })
      .expect(201);
  });

  it('protects routes with JWT middleware', async () => {
    await request(app).get('/secure').expect(401);

    const token = signToken({ id: 42 }, { secret: 'test-secret' });
    const res = await request(app)
      .get('/secure')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert.equal(res.body.user.id, 42);
  });

  it('handles AppError as JSON', async () => {
    const res = await request(app).get('/fail').expect(400);
    assert.equal(res.body.error.message, 'Bad things');
    assert.deepEqual(res.body.error.details, { code: 'BAD' });
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/nope').expect(404);
    assert.match(res.body.error.message, /not found/i);
  });

  it('reuses inbound X-Request-Id', async () => {
    const res = await request(app)
      .get('/hello')
      .set('X-Request-Id', 'abc-123')
      .expect(200);
    assert.equal(res.headers['x-request-id'], 'abc-123');
  });
});

describe('signToken without secret', () => {
  it('throws AppError', () => {
    const prev = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    try {
      assert.throws(
        () => signToken({ a: 1 }),
        (err) => err instanceof AppError,
      );
    } finally {
      if (prev !== undefined) process.env.JWT_SECRET = prev;
    }
  });
});
