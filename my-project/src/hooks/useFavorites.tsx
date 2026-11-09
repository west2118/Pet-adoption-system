import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { favoriteService } from '@/services/favoriteService';
import type { ToggleFavoriteResult } from '@/services/favoriteService';
import { describeApiError } from '@/utils/errors';

interface FavoritesContextValue {
  favorites: string[];
  loading: boolean;
  error: string | null;
  isFavorite: (petId: string) => boolean;
  toggleFavorite: (petId: string) => Promise<ToggleFavoriteResult>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Favorites belong to the signed-in user: reload whenever the session
  // identity changes, clear on logout. Guests hold no list — tapping a heart
  // sends them to /login (handled by the caller via 'login-required').
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!userId) {
        if (mounted) {
          setFavorites([]);
          setLoading(false);
        }
        return;
      }
      try {
        const pets = await favoriteService.listMine();
        if (!mounted) return;
        setFavorites(pets.map((p) => p.id));
        setError(null);
      } catch (err) {
        if (mounted) setError(describeApiError(err, 'Could not load your favorites.'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const toggleFavorite = useCallback(
    async (petId: string): Promise<ToggleFavoriteResult> => {
      if (!userId) return 'login-required';

      const adding = !favorites.includes(petId);
      const next = adding
        ? [...favorites, petId]
        : favorites.filter((id) => id !== petId);
      // Optimistic flip so the heart responds instantly.
      setFavorites(next);

      try {
        if (adding) await favoriteService.add(petId);
        else await favoriteService.remove(petId);
        return adding ? 'added' : 'removed';
      } catch {
        // Roll back the optimistic flip — the heart returns to its real state.
        setFavorites(favorites);
        return 'error';
      }
    },
    [favorites, userId],
  );

  const isFavorite = useCallback((petId: string) => favorites.includes(petId), [favorites]);

  const value = useMemo(
    () => ({ favorites, loading, error, isFavorite, toggleFavorite }),
    [favorites, loading, error, isFavorite, toggleFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = (): FavoritesContextValue => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
};
