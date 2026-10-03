import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/pet_adoption_test';
process.env.JWT_SECRET = 'test-secret-at-least-16-chars';
process.env.JWT_EXPIRES_IN = '7d';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173';

let app;
let request;

before(async () => {
  const { createApp } = await import('../src/app.js');
  const supertest = (await import('supertest')).default;
  app = createApp();
  request = supertest(app);
});

describe('smoke (no database required)', () => {
  it('GET /health returns ok envelope', async () => {
    const res = await request.get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'ok');
  });

  it('GET /api/v1/health returns ok envelope', async () => {
    const res = await request.get('/api/v1/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it('unknown route returns NOT_FOUND envelope', async () => {
    const res = await request.get('/api/v1/nope');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });

  it('POST /auth/signup with empty body returns VALIDATION_ERROR (no DB hit)', async () => {
    const res = await request.post('/api/v1/auth/signup').send({});
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(res.body.error.details));
  });

  it('GET /auth/me without token returns 401', async () => {
    const res = await request.get('/api/v1/auth/me');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('POST /applications without token returns 401', async () => {
    const res = await request.post('/api/v1/applications').send({});
    assert.equal(res.status, 401);
  });

  it('GET /admin/stats without token returns 401', async () => {
    const res = await request.get('/api/v1/admin/stats');
    assert.equal(res.status, 401);
  });
});
