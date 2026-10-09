import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/pet_adoption_test';
process.env.JWT_SECRET = 'test-secret-at-least-16-chars';
process.env.JWT_EXPIRES_IN = '7d';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173';

const { petQuerySchema } = await import('../src/validators/petValidator.js');
const { parsePagination } = await import('../src/validators/commonValidator.js');
const { buildPublicFilters } = await import('../src/repositories/petRepository.js');

describe('GET /pets pagination (backend owns the limit)', () => {
  it('defaults to 10 items per page', () => {
    const parsed = petQuerySchema.parse({});
    assert.equal(parsed.limit, '10');
    assert.equal(parsed.page, '1');
  });

  it('clamps an explicit limit to 1..100 and derives the offset', () => {
    assert.deepEqual(parsePagination({ page: '3', limit: '10' }), {
      page: 3,
      limit: 10,
      offset: 20,
    });
    assert.equal(parsePagination({ limit: '500' }).limit, 100);
    assert.equal(parsePagination({ limit: 'abc' }).limit, 10);
    assert.equal(parsePagination({ page: '0' }).page, 1);
  });

  it('accepts the browse facets without failing validation', () => {
    const parsed = petQuerySchema.parse({
      page: '2',
      search: 'luna',
      species: 'cat',
      temperament: 'Playful',
      location: 'Quezon City',
      excludeAdopted: 'true',
    });
    assert.equal(parsed.temperament, 'Playful');
    assert.equal(parsed.location, 'Quezon City');
    assert.equal(parsed.excludeAdopted, 'true');
  });
});

describe('buildPublicFilters (browse facets pushed to SQL)', () => {
  it('always restricts to public, non in-process pets', () => {
    const { conditions } = buildPublicFilters({});
    assert.ok(conditions.includes(`visibility = 'public'`));
    assert.ok(conditions.includes(`status <> 'In Process'`));
  });

  it('matches temperament case-insensitively across the TEXT[] column', () => {
    const { conditions, values } = buildPublicFilters({ temperament: 'Playful' });
    const clause = conditions.find((c) => c.includes('unnest(temperament)'));
    assert.ok(clause, 'expected a temperament clause');
    assert.equal(values.at(-1), 'playful');
    assert.ok(clause.includes(`$${values.length}`));
  });

  it('resolves shelter location through shelters.location', () => {
    const { conditions, values } = buildPublicFilters({ location: 'Quezon City' });
    const clause = conditions.find((c) => c.includes('shelter_id IN'));
    assert.ok(clause, 'expected a location subquery');
    assert.ok(clause.includes(`$${values.length}`));
    assert.equal(values.at(-1), 'Quezon City');
  });

  it('hides adopted pets only when excludeAdopted is set', () => {
    assert.ok(!buildPublicFilters({}).conditions.includes(`status <> 'Adopted'`));
    assert.ok(
      buildPublicFilters({ excludeAdopted: true }).conditions.includes(`status <> 'Adopted'`),
    );
  });
});
