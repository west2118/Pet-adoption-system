/**
 * Reverse geocoding via OpenStreetMap Nominatim (free, no API key).
 *
 * Nominatim's usage policy requires a low request rate and an identifying
 * Referer/User-Agent; browsers send the page Referer automatically, and this is
 * only called on an explicit user action, so a single onboarding request is fine.
 */

interface NominatimAddress {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  suburb?: string;
  neighbourhood?: string;
  village?: string;
  town?: string;
  city?: string;
  municipality?: string;
  county?: string;
  state?: string;
  region?: string;
  postcode?: string;
  country?: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: NominatimAddress;
}

export interface ReverseGeocodeResult {
  /** Full street address, e.g. "123 Bayani St, Quezon City". */
  address: string;
  /** City + region, e.g. "Quezon City, Metro Manila". */
  location: string;
  /** Coordinates the address was resolved from, for the map preview. */
  latitude: number;
  longitude: number;
}

export type GeolocationFailure =
  | 'unsupported'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'geocode_failed';

/** Wraps the callback-based Geolocation API in a promise. */
export const getCurrentPosition = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12_000,
      maximumAge: 0,
    });
  });

export const toGeolocationFailure = (err: unknown): GeolocationFailure => {
  const code = (err as GeolocationPositionError | undefined)?.code;
  if (code === 1) return 'denied';
  if (code === 2) return 'unavailable';
  if (code === 3) return 'timeout';
  const message = (err as Error | undefined)?.message;
  if (message === 'unsupported' || message === 'geocode_failed') return message;
  return 'unavailable';
};

export const reverseGeocode = async (
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult> => {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
    `&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('geocode_failed');

  const data = (await res.json()) as NominatimResponse;
  const a = data.address ?? {};

  const street = [a.house_number, a.road ?? a.pedestrian].filter(Boolean).join(' ');
  const area = a.suburb ?? a.neighbourhood;
  const city = a.city ?? a.town ?? a.village ?? a.municipality;
  const region = a.state ?? a.region;

  const address =
    [street, area, city, region, a.postcode, a.country].filter(Boolean).join(', ') ||
    data.display_name ||
    '';

  const location = [city ?? a.county, region].filter(Boolean).join(', ');

  return { address, location, latitude, longitude };
};

/** One call: coordinates -> { address, location }. */
export const locateAddress = async (): Promise<ReverseGeocodeResult> => {
  const position = await getCurrentPosition();
  const { latitude, longitude } = position.coords;
  return reverseGeocode(latitude, longitude);
};
