/**
 * Shelter geolocation helpers.
 *
 * Shelters store precise coordinates when they are known. Onboarding and the
 * admin forms only collect a city/address, so creation/update falls back to the
 * matching city centre — close enough for "pets near me" ordering, and always
 * better than a shelter that can never appear in nearby results.
 */

/** City centres ordered specific → generic (``manila`` must stay last). */
const CITY_COORDINATES = [
  { city: 'paranaque', latitude: 14.4791, longitude: 121.0198 },
  { city: 'quezon city', latitude: 14.676, longitude: 121.0437 },
  { city: 'makati', latitude: 14.5547, longitude: 121.0244 },
  { city: 'taguig', latitude: 14.5176, longitude: 121.0509 },
  { city: 'pasig', latitude: 14.5764, longitude: 121.0851 },
  { city: 'mandaluyong', latitude: 14.5794, longitude: 121.0359 },
  { city: 'las pinas', latitude: 14.4445, longitude: 120.9939 },
  { city: 'muntinlupa', latitude: 14.4081, longitude: 121.0415 },
  { city: 'caloocan', latitude: 14.6488, longitude: 120.9675 },
  { city: 'valenzuela', latitude: 14.7011, longitude: 120.983 },
  { city: 'marikina', latitude: 14.6507, longitude: 121.1029 },
  { city: 'san juan', latitude: 14.6019, longitude: 121.0355 },
  { city: 'navotas', latitude: 14.6667, longitude: 120.9417 },
  { city: 'malabon', latitude: 14.6629, longitude: 120.9569 },
  { city: 'pateros', latitude: 14.5557, longitude: 121.0697 },
  { city: 'manila', latitude: 14.5995, longitude: 120.9842 },
  { city: 'cebu', latitude: 10.3157, longitude: 123.8854 },
  { city: 'davao', latitude: 7.1907, longitude: 125.4553 },
  { city: 'tagaytay', latitude: 14.1153, longitude: 120.9621 },
  { city: 'antipolo', latitude: 14.586, longitude: 121.176 },
  { city: 'batangas', latitude: 13.7565, longitude: 121.0583 },
  { city: 'baguio', latitude: 16.4023, longitude: 120.596 },
  { city: 'iloilo', latitude: 10.7202, longitude: 122.5621 },
  { city: 'bacolod', latitude: 10.6765, longitude: 122.9509 },
  { city: 'cagayan de oro', latitude: 8.4542, longitude: 124.6319 },
  { city: 'general santos', latitude: 6.1164, longitude: 125.1716 },
];

const normalize = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const isValidLatitude = (value) => Number.isFinite(value) && Math.abs(value) <= 90;
export const isValidLongitude = (value) => Number.isFinite(value) && Math.abs(value) <= 180;

export const cityCoordinatesFor = (location, address) => {
  const haystack = `${normalize(location)} ${normalize(address)}`.trim();
  if (!haystack) return null;
  const match = CITY_COORDINATES.find((entry) => haystack.includes(entry.city));
  return match ? { latitude: match.latitude, longitude: match.longitude } : null;
};

/**
 * Returns stored coordinates when they are valid, otherwise a city-centre
 * fallback derived from `location` / `address`. Missing data yields nulls.
 */
export const resolveShelterCoordinates = ({ latitude, longitude, location, address } = {}) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (isValidLatitude(lat) && isValidLongitude(lng)) {
    return { latitude: lat, longitude: lng };
  }
  return cityCoordinatesFor(location, address) ?? { latitude: null, longitude: null };
};
