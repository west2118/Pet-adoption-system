import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/test';
process.env.JWT_SECRET = 'inquiry-test-secret-at-least-16';
const { pool } = await import('../src/config/database.js');
const { inquiryRoutes } = await import('../src/routes/inquiryRoutes.js');
const app = express();
app.use('/inquiries', inquiryRoutes);
app.use((err, _req, res, _next) => res.status(err.statusCode ?? 500).json({ error: err.message }));
const petId = '00000000-0000-4000-8000-000000000001';
const token = (role) => jwt.sign({ id: 'adopter-1', email: 'adopter@example.com', role }, process.env.JWT_SECRET);

test('inquiry status requires an adopter session', async () => {
  await request(app).get(`/inquiries/my/pet/${petId}`).expect(401);
  await request(app).get(`/inquiries/my/pet/${petId}`)
    .set('Authorization', `Bearer ${token('shelter_staff')}`).expect(403);
});

test('inquiry lookup uses session email, returns only submitted state, and scopes to pet', async (t) => {
  let submitted = true;
  t.mock.method(pool, 'query', async (_sql, params) => {
    assert.deepEqual(params, [petId, 'adopter@example.com']);
    return { rows: [{ submitted }] };
  });
  const get = () => request(app).get(`/inquiries/my/pet/${petId}?email=someone-else@example.com`)
    .set('Authorization', `Bearer ${token('adopter')}`);
  let response = await get().expect(200);
  assert.deepEqual(response.body.data, { submitted: true });
  submitted = false;
  response = await get().expect(200);
  assert.deepEqual(response.body.data, { submitted: false });
});
