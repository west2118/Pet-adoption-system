/**
 * Geo / IP helper for location detection and suspicious login checks.
 */

const LOCAL_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost']);

export const isPrivateOrLocalIp = (ip) => {
  if (!ip) return true;
  if (LOCAL_IPS.has(ip)) return true;
  // RFC 1918 & private IPv4
  if (
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
    ip.startsWith('fc00:') ||
    ip.startsWith('fe80:')
  ) {
    return true;
  }
  return false;
};

/**
 * Extract client IP from Express request, respecting reverse proxies.
 */
export const extractClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = String(forwarded).split(',')[0].trim();
    if (first) return first;
  }
  const realIp = req.headers['x-real-ip'];
  if (realIp) return String(realIp).trim();
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
};

/**
 * Query public IP geolocation via ip-api.com (timeout-safe, never throws).
 */
export const lookupIpLocation = async (ip) => {
  if (!ip || isPrivateOrLocalIp(ip)) {
    return {
      city: 'Local Network',
      country: 'Local',
      countryCode: 'LOC',
      lat: null,
      lon: null,
      isLocal: true,
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,city,lat,lon`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status === 'success') {
      return {
        city: data.city || null,
        country: data.country || null,
        countryCode: data.countryCode || null,
        lat: typeof data.lat === 'number' ? data.lat : null,
        lon: typeof data.lon === 'number' ? data.lon : null,
        isLocal: false,
      };
    }
  } catch {
    // Fail gracefully without blocking authentication
  }

  return {
    city: null,
    country: null,
    countryCode: null,
    lat: null,
    lon: null,
    isLocal: false,
  };
};

/**
 * Calculates distance in kilometers between two lat/lon points using Haversine formula.
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Determines whether a login attempt is from a suspicious / different location
 * compared to the user's last recorded login.
 *
 * A location is suspicious when:
 * 1. User has a prior recorded login location AND
 * 2. Country has changed, OR
 * 3. City has changed and coordinates indicate > 100km distance, OR
 * 4. Client explicitly reported a different timezone / location string.
 */
export const isSuspiciousLocation = (user, currentLocation, clientLocation) => {
  // If user has never logged in before, the first login establishes the baseline.
  if (!user.last_login_at && !user.last_login_city && !user.last_login_ip) {
    return false;
  }

  // If previous location was local and current is local, not suspicious
  if (
    currentLocation.isLocal &&
    (!user.last_login_ip || isPrivateOrLocalIp(user.last_login_ip))
  ) {
    // Check if client explicitly sent a client location / timezone that changed
    if (clientLocation && user.last_login_city && clientLocation !== user.last_login_city) {
      return true;
    }
    return false;
  }

  // If country is known on both and has changed
  if (
    user.last_login_country &&
    currentLocation.country &&
    user.last_login_country.toLowerCase() !== currentLocation.country.toLowerCase()
  ) {
    return true;
  }

  // If both have coordinates, check geographic distance
  if (
    user.last_login_lat != null &&
    user.last_login_lon != null &&
    currentLocation.lat != null &&
    currentLocation.lon != null
  ) {
    const dist = calculateDistanceKm(
      Number(user.last_login_lat),
      Number(user.last_login_lon),
      Number(currentLocation.lat),
      Number(currentLocation.lon),
    );
    if (dist != null && dist > 150) {
      return true;
    }
  }

  // If city is known on both and differs
  if (
    user.last_login_city &&
    currentLocation.city &&
    !currentLocation.isLocal &&
    user.last_login_city.toLowerCase() !== currentLocation.city.toLowerCase()
  ) {
    return true;
  }

  // If client provided a clientLocation (e.g. "Tokyo, Japan" or browser timezone)
  // and it differs from recorded last_login_city:
  if (
    clientLocation &&
    user.last_login_city &&
    user.last_login_city.toLowerCase() !== clientLocation.toLowerCase()
  ) {
    return true;
  }

  return false;
};
