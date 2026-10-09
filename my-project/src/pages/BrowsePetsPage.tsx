import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Pet } from '@/types';
import { Container } from '@/components/layout/Container';
import { Reveal } from '@/components/shared';
import { FilterBar } from '@/components/features/FilterBar';
import { PetsHero } from '@/components/features/PetsHero';
import { PetsTicker } from '@/components/features/PetsTicker';
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

  // Adopted pets have found homes — they never appear in browse results,
  // only adoptable listings (Available + Fostered) do.
  const browsablePets = useMemo(
    () => visiblePets.filter((pet) => pet.status !== 'Adopted'),
    [visiblePets],
  );

  const { filters, updateFilter, clearFilter, resetFilters, filteredPets, activeFilterCount } =
    usePetFilter(browsablePets, shelters, presetLocation);

  const adoptablePets = useMemo(
    () => browsablePets.filter((pet) => pet.status === 'Available'),
    [browsablePets],
  );
  const adoptedCount = useMemo(
    () => visiblePets.filter((pet) => pet.status === 'Adopted').length,
    [visiblePets],
  );
  /** Adoptable animals lead the orbit ring; the rest fill it out behind them. */
  const orbitPets = useMemo(() => {
    const statusRank: Record<Pet['status'], number> = {
      Available: 0,
      'In Process': 1,
      Fostered: 2,
      Adopted: 3,
    };
    return [...browsablePets].sort((a, b) => statusRank[a.status] - statusRank[b.status]);
  }, [browsablePets]);

  const breeds = useMemo(
    () => Array.from(new Set(browsablePets.map((p) => p.breed))).sort(),
    [browsablePets],
  );
  const locations = useMemo(
    () => Array.from(new Set(shelters.map((s) => s.location))).sort(),
    [shelters],
  );
  const temperaments = useMemo(
    () => Array.from(new Set(browsablePets.flatMap((p) => p.temperament))).sort(),
    [browsablePets],
  );

  const locationByShelter = useMemo(
    () => new Map(shelters.map((s) => [s.id, s.location])),
    [shelters],
  );

  const tickerItems = useMemo(
    () =>
      orbitPets.slice(0, 8).map((pet) => {
        const location = locationByShelter.get(pet.shelterId);
        return location ? `${pet.name} · ${location}` : pet.name;
      }),
    [orbitPets, locationByShelter],
  );

  /**
   * Keying the grid on the facet selects makes React remount the cards, which
   * replays their `Reveal` cascade whenever a filter changes. `search` is left out
   * on purpose — re-keying on every keystroke would make typing feel like the
   * grid is thrashing, and search results already update instantly.
   */
  const facetSignature = useMemo(
    () =>
      Object.entries(filters)
        .filter(([key]) => key !== 'search')
        .map(([key, value]) => `${key}:${value}`)
        .join('|'),
    [filters],
  );

  return (
    <div className="landing-theme">
      <PetsHero
        pets={orbitPets}
        availableCount={adoptablePets.length}
        shelterCount={shelters.length}
        listedCount={browsablePets.length}
        adoptedCount={adoptedCount}
      />

      <PetsTicker items={tickerItems} />

      <Container className="py-10 lg:py-14">
        <div id="pet-listings" className="scroll-mt-28">
          <Reveal>
            <span className="inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
              <span className="h-px w-12 bg-[var(--brand)]" />
              Listings
            </span>

            <h2 className="mt-6 font-display text-[clamp(2rem,4vw,3.25rem)] leading-[0.95] tracking-tight">
              {filteredPets.length}{' '}
              <span className="text-foreground/45">
                {filteredPets.length === 1 ? 'pet' : 'pets'} ready to meet
              </span>
            </h2>

            <p className="mt-3 text-sm text-muted-foreground">
              {activeFilterCount > 0
                ? `${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} applied`
                : 'Every adoptable animal across our partner shelters.'}
            </p>
          </Reveal>
        </div>

        <Reveal delay={100} className="mt-8">
          <FilterBar
            filters={filters}
            onChange={updateFilter}
            onClear={clearFilter}
            onReset={resetFilters}
            activeCount={activeFilterCount}
            breeds={breeds}
            locations={locations}
            temperaments={temperaments}
          />
        </Reveal>

        <div className="mt-8">
          {loading ? (
            <LoadingGrid count={6} />
          ) : error ? (
            <EmptyState title="Could not load pets" description={error} />
          ) : filteredPets.length === 0 ? (
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
            <div
              key={facetSignature}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredPets.map((pet, index) => (
                <Reveal key={pet.id} delay={Math.min(index, 8) * 70}>
                  <PetCard
                    pet={pet}
                    className="h-full"
                    shelterLocation={locationByShelter.get(pet.shelterId)}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};
