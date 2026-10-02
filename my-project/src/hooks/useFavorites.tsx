import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface FavoritesContextValue {
  favorites: string[];
  isFavorite: (petId: string) => boolean;
  toggleFavorite: (petId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<string[]>(['p1', 'p4']);

  const toggleFavorite = useCallback((petId: string) => {
    setFavorites((prev) =>
      prev.includes(petId) ? prev.filter((id) => id !== petId) : [...prev, petId],
    );
  }, []);

  const isFavorite = useCallback(
    (petId: string) => favorites.includes(petId),
    [favorites],
  );

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite }),
    [favorites, isFavorite, toggleFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextValue => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
};
