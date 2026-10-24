import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';

export const NEARBY_RADIUS_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_RADIUS_KM = 25;
const PREFERENCE_KEY = 'paws.nearby.preference';
const RADIUS_KEY = 'paws.nearby.radius';

type NearbyPreference = 'auto' | 'on' | 'off';

const readPreference = (): NearbyPreference => {
  const stored = localStorage.getItem(PREFERENCE_KEY);
  return stored === 'on' || stored === 'off' ? stored : 'auto';
};

const readRadius = (): number => {
  const stored = Number(localStorage.getItem(RADIUS_KEY));
  return (NEARBY_RADIUS_OPTIONS as readonly number[]).includes(stored)
    ? stored
    : DEFAULT_RADIUS_KM;
};

export interface NearbySearch {
  latitude: number;
  longitude: number;
  radiusKm: number;
}

/**
 * Owns the "Near me" preference + radius on top of browser geolocation.
 *
 * - First visit: inactive (no permission prompt).
 * - Returning visitor whose browser already allows location: activates
 *   automatically and lists the closest pets first.
 * - Explicit opt-in/out is stored so the choice survives reloads.
 */
export const useNearbyPets = () => {
  const [preference, setPreference] = useState<NearbyPreference>(readPreference);
  const { supported, status, coordinates, error, requestLocation } = useGeolocation({
    autoDetect: preference !== 'off',
  });
  const [radiusKm, setRadiusKmState] = useState<number>(readRadius);
  const requestedRef = useRef(false);

  // Restore an explicitly enabled "Near me" after a reload.
  useEffect(() => {
    if (preference !== 'on' || coordinates || requestedRef.current) return;
    requestedRef.current = true;
    requestLocation();
  }, [coordinates, preference, requestLocation]);

  const enable = useCallback(() => {
    setPreference('on');
    localStorage.setItem(PREFERENCE_KEY, 'on');
    requestedRef.current = true;
    if (!coordinates) requestLocation();
  }, [coordinates, requestLocation]);

  const disable = useCallback(() => {
    setPreference('off');
    localStorage.setItem(PREFERENCE_KEY, 'off');
  }, []);

  const active = preference !== 'off' && coordinates !== null;
  // Keep the control "on" while an explicit opt-in is still resolving — or
  // after it failed (denied permission) — so the visitor can always turn the
  // preference back off instead of being stuck on a request that cannot work.
  const enabled = active || preference === 'on';

  const toggle = useCallback(() => {
    if (enabled) {
      disable();
      return;
    }
    enable();
  }, [disable, enable, enabled]);

  const setRadiusKm = useCallback((value: number) => {
    setRadiusKmState(value);
    localStorage.setItem(RADIUS_KEY, String(value));
  }, []);

  const search = useMemo<NearbySearch | null>(
    () =>
      active && coordinates
        ? {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            radiusKm,
          }
        : null,
    [active, coordinates, radiusKm],
  );

  return {
    supported,
    status,
    // Only surface a failure after the visitor explicitly opted in — a
    // previously denied permission should not greet them with an error.
    error: preference === 'on' ? error : null,
    active,
    enabled,
    radiusKm,
    search,
    toggle,
    setRadiusKm,
  };
};
