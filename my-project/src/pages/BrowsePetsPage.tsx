import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { FilterBar } from '@/components/features/FilterBar';
import { PetCard } from '@/components/features/PetCard';
import { EmptyState, LoadingGrid } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import { usePets, useShelters } from '@/hooks/useData';
import { usePetFilter } from '@/hooks/usePetFilter';
import { publicPets } from '@/data/mockData';

export const BrowsePetsPage = () => {
  const { pets, loading, error } = usePets();
  const { shelters } = useShelters();
  const [params] = useSearchParams();
  const presetLocation = params.get('location') ?? 'all';

  const visiblePets = useMemo(() => publicPets(pets), [pets]);

  const { filters, updateFilter, resetFilters, filteredPets, activeFilterCount } =
    usePetFilter(visiblePets, shelters);

  // Apply ?location= preset once shelters/pets are ready
  const effectivePets = useMemo(() => {
    if (presetLocation !== 'all' && filters.location === 'all') {
      const q = filters.search.trim().toLowerCase();
      return visiblePets.filter((pet) => {
        const loc = shelters.find((s) => s.id === pet.shelterId)?.location ?? '';
        if (loc !== presetLocation) return false;
        if (q && !`${pet.name} ${pet.breed}`.toLowerCase().includes(q)) return false;
        return true;
      });
    }
    return filteredPets;
  }, [presetLocation, filters, filteredPets, visiblePets, shelters]);

  const breeds = useMemo(
    () => Array.from(new Set(visiblePets.map((p) => p.breed))).sort(),
    [visiblePets],
  );
  const locations = useMemo(
    () => Array.from(new Set(shelters.map((s) => s.location))).sort(),
    [shelters],
  );
  const temperaments = useMemo(
    () => Array.from(new Set(visiblePets.flatMap((p) => p.temperament))).sort(),
    [visiblePets],
  );

  const shelterLocation = (shelterId: string) =>
    shelters.find((s) => s.id === shelterId)?.location;

  return (
    <Container className="py-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Browse pets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {effectivePets.length} result{effectivePets.length === 1 ? '' : 's'}
            {activeFilterCount > 0 ? ` · ${activeFilterCount} filter(s) active` : ''}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <FilterBar
          filters={filters}
          onChange={updateFilter}
          onReset={resetFilters}
          activeCount={activeFilterCount}
          breeds={breeds}
          locations={locations}
          temperaments={temperaments}
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <LoadingGrid count={6} />
        ) : error ? (
          <EmptyState title="Could not load pets" description={error} />
        ) : effectivePets.length === 0 ? (
          <EmptyState
            title="No pets match your filters"
            description="Try clearing a filter or searching for a different breed."
            icon="search"
            action={
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear all filters
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {effectivePets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                shelterLocation={shelterLocation(pet.shelterId)}
              />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};
