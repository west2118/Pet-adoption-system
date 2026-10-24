import { useCallback, useEffect, useRef, useState } from 'react';

export type GeolocationStatus =
  | 'unsupported'
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'error';

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

const PERMISSION_DENIED_MESSAGE =
  'Location access is blocked. Allow location for this site in your browser settings, then try again.';
const UNAVAILABLE_MESSAGE =
  'We could not detect your location. Check your connection and try again.';

interface UseGeolocationOptions {
  /**
   * Silently read the position when the browser has already granted
   * geolocation permission. Users who never opted in are not prompted.
   */
  autoDetect?: boolean;
}

/**
 * Browser geolocation with an explicit request method.
 *
 * Nothing is prompted on mount: the Permissions API is only used to pick up an
 * existing grant (returning visitors). First-time visitors activate the feature
 * with the "Near me" button, which keeps the permission prompt in their hands.
 */
export const useGeolocation = ({ autoDetect = true }: UseGeolocationOptions = {}) => {
  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
  const [status, setStatus] = useState<GeolocationStatus>(
    supported ? 'idle' : 'unsupported',
  );
  const [coordinates, setCoordinates] = useState<GeoCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestingRef = useRef(false);
  const mountedRef = useRef(true);
  // Automatic detection runs once, with the preference read on mount. Later
  // toggles go through the explicit `requestLocation` call in `useNearbyPets`.
  const autoDetectRef = useRef(autoDetect);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const requestLocation = useCallback(
    ({ silent = false }: { silent?: boolean } = {}): Promise<GeoCoordinates | null> => {
      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        if (!silent) {
          setStatus('unsupported');
          setError('Location detection is not supported in this browser.');
        }
        return Promise.resolve(null);
      }
      if (requestingRef.current) return Promise.resolve(null);

      requestingRef.current = true;
      setStatus('requesting');
      if (!silent) setError(null);

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            requestingRef.current = false;
            const next: GeoCoordinates = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            };
            if (!mountedRef.current) {
              resolve(next);
              return;
            }
            setCoordinates(next);
            setStatus('granted');
            setError(null);
            resolve(next);
          },
          (geoError) => {
            requestingRef.current = false;
            if (!mountedRef.current) {
              resolve(null);
              return;
            }
            if (silent) {
              // A background refresh failing must not scare anyone; the button
              // remains available for an explicit retry.
              setStatus('idle');
              resolve(null);
              return;
            }
            const denied = geoError.code === geoError.PERMISSION_DENIED;
            setStatus(denied ? 'denied' : 'error');
            setError(denied ? PERMISSION_DENIED_MESSAGE : UNAVAILABLE_MESSAGE);
            resolve(null);
          },
          { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
        );
      });
    },
    [],
  );

  useEffect(() => {
    if (!supported || !autoDetectRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (cancelled) return;
        if (permission.state === 'granted') {
          requestLocation({ silent: true });
        } else if (permission.state === 'denied') {
          setStatus('denied');
          setError(PERMISSION_DENIED_MESSAGE);
        }
      } catch {
        // Permissions API unavailable — wait for an explicit "Near me" click.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requestLocation, supported]);

  return { supported, status, coordinates, error, requestLocation };
};
