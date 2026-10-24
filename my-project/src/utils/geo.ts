export interface Coordinates {
  latitude: number;
  longitude: number;
}

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * Great-circle distance between two coordinates in kilometres.
 *
 * Mirrors the SQL Haversine expression used by `GET /pets?lat=&lng=` so the
 * demo-mode mock fallback ranks pets exactly like the backend does.
 */
export const haversineKm = (from: Coordinates, to: Coordinates): number => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** Human-readable distance for pet cards (``< 100 m``, ``850 m``, ``2.4 km``). */
export const formatDistanceKm = (km?: number | null): string => {
  if (km == null || !Number.isFinite(km) || km < 0) return '';
  if (km < 0.1) return '< 100 m';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
};
