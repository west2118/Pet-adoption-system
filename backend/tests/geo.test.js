import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const { cityCoordinatesFor, resolveShelterCoordinates } = await import('../src/utils/geo.js');
const { petQuerySchema } = await import('../src/validators/petValidator.js');

describe('shelter geolocation', () => {
  it('keeps valid stored coordinates', () => {
    assert.deepEqual(
      resolveShelterCoordinates({ latitude: 14.5, longitude: 121.1 }),
      { latitude: 14.5, longitude: 121.1 },
    );
  });

  it('falls back to a city centre when coordinates are missing', () => {
    const coords = resolveShelterCoordinates({
      location: 'Parañaque, Metro Manila',
      address: 'Scoop Street, Fourth Estate, Parañaque',
    });
    assert.deepEqual(coords, { latitude: 14.4791, longitude: 121.0198 });
  });

  it('matches city names without accents and prefers the specific city', () => {
    assert.deepEqual(
      cityCoordinatesFor('Parañaque, Metro Manila', ''),
      { latitude: 14.4791, longitude: 121.0198 },
    );
    assert.deepEqual(
      cityCoordinatesFor('Cebu', '45 Mango Ave, Cebu City'),
      { latitude: 10.3157, longitude: 123.8854 },
    );
  });

  it('returns nulls when neither coordinates nor a known city are present', () => {
    assert.deepEqual(
      resolveShelterCoordinates({ location: 'Unknown Town', address: 'Nowhere' }),
      { latitude: null, longitude: null },
    );
  });

  it('rejects out-of-range coordinates instead of persisting them', () => {
    assert.deepEqual(
      resolveShelterCoordinates({ latitude: 200, longitude: 500 }),
      { latitude: null, longitude: null },
    );
  });
});

describe('nearby catalogue query', () => {
  it('accepts lat/lng/radiusKm/sort alongside the browse facets', () => {
    const parsed = petQuerySchema.parse({
      lat: '14.48',
      lng: '121.02',
      radiusKm: '25',
      sort: 'distance',
      excludeAdopted: 'true',
    });
    assert.equal(parsed.lat, '14.48');
    assert.equal(parsed.lng, '121.02');
    assert.equal(parsed.radiusKm, '25');
    assert.equal(parsed.sort, 'distance');
  });
});
