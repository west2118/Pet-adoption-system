import { Link } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { PetCard } from '@/components/features/PetCard';
import { EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { usePets, useShelters } from '@/hooks/useData';
import { publicPets } from '@/data/mockData';

export const FavoritesPage = () => {
  const { favorites } = useFavorites();
  const { pets, loading } = usePets();
  const { shelters } = useShelters();

  const saved = publicPets(pets).filter((p) => favorites.includes(p.id));

  return (
    <Container className="py-6">
      <h1 className="text-3xl font-bold tracking-tight">Saved favorites</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your watchlist for pets you are interested in.
      </p>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : saved.length === 0 ? (
          <EmptyState
            title="No favorites saved"
            description="Tap the heart on any pet to add it to your watchlist."
            action={
              <Link to="/pets">
                <Button size="sm">Browse pets</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                shelterLocation={shelters.find((s) => s.id === pet.shelterId)?.location}
              />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};
