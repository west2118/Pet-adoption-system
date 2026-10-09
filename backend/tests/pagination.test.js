import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/pet_adoption_test';
process.env.JWT_SECRET = 'test-secret-at-least-16-chars';
process.env.JWT_EXPIRES_IN = '7d';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173';

const { parsePagination } = await import('../src/validators/commonValidator.js');

describe('parsePagination (page sizes are owned by the backend)', () => {
  it('defaults to 10 items per page', () => {
    assert.deepEqual(parsePagination({}), { page: 1, limit: 10, offset: 0 });
  });

  it('supports a per-endpoint default — my applications uses 5', () => {
    assert.deepEqual(parsePagination({}, 5), { page: 1, limit: 5, offset: 0 });
    assert.deepEqual(parsePagination({ page: '3' }, 5), { page: 3, limit: 5, offset: 10 });
  });

  it('lets an explicit limit override the endpoint default', () => {
    assert.equal(parsePagination({ limit: '20' }, 5).limit, 20);
    assert.equal(parsePagination({ limit: '20' }).limit, 20);
  });

  it('clamps explicit limits and keeps bad input on the default', () => {
    assert.equal(parsePagination({ limit: '500' }, 5).limit, 100);
    assert.equal(parsePagination({ limit: '0' }, 5).limit, 5);
    assert.equal(parsePagination({ limit: 'abc' }, 5).limit, 5);
    assert.equal(parsePagination({ page: '-4' }).page, 1);
  });
});
