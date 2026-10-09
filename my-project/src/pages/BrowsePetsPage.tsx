import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Pet } from '@/types';
import { Container } from '@/components/layout/Container';
import { Reveal, TablePagination } from '@/components/shared';
import { FilterBar } from '@/components/features/FilterBar';
import { PetsHero } from '@/components/features/PetsHero';
import { PetsTicker } from '@/components/features/PetsTicker';
import { PetCard } from '@/components/features/PetCard';
import { EmptyState, LoadingGrid } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import { useBrowsePetsPage, useHeroPets, usePetFacets, useShelters } from '@/hooks/useData';
import { usePetFilter } from '@/hooks/usePetFilter';
import { cn } from '@/lib/utils';

export const BrowsePetsPage = () => {
  const { shelters } = useShelters();
  const [params] = useSearchParams();
  const presetLocation = params.get('location') ?? 'all';

  // Facet options + hero counts come from the backend in one small request,
  // so the page never downloads the whole catalogue just to fill dropdowns.
  const facets = usePetFacets();
  /** The hero orbit + ticker only ever show a handful of pets. */
  const heroPets = useHeroPets();

  // This hook only owns filter *state* — the actual filtering happens in the
  // backend, which also owns the page size (10 per page).
  const { filters, updateFilter, clearFilter, resetFilters, activeFilterCount } = usePetFilter(
    [],
    shelters,
    presetLocation,
  );

  const { pets: pagePets, total, pageSize, page, setPage, loading, error } =
    useBrowsePetsPage(filters);

  // Any filter change invalidates the current page, so go back to page 1.
  const changeFilter = (key: keyof typeof filters, value: string) => {
    setPage(1);
    updateFilter(key, value);
  };
  const clearOne = (key: keyof typeof filters) => {
    setPage(1);
    clearFilter(key);
  };
  const resetAll = () => {
    setPage(1);
    resetFilters();
  };

  const goToPage = (next: number) => {
    setPage(next);
    document
      .getElementById('pet-listings')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /** Adoptable animals lead the orbit ring; the rest fill it out behind them. */
  const orbitPets = useMemo(() => {
    const statusRank: Record<Pet['status'], number> = {
      Available: 0,
      'In Process': 1,
      Fostered: 2,
      Adopted: 3,
    };
    return heroPets
      .filter((pet) => pet.status !== 'Adopted')
      .sort((a, b) => statusRank[a.status] - statusRank[b.status]);
  }, [heroPets]);

  const breeds = facets?.breeds ?? [];
  const temperaments = facets?.temperaments ?? [];
  const locations = useMemo(
    () => Array.from(new Set(shelters.map((s) => s.location))).sort(),
    [shelters],
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
        availableCount={facets?.stats.available ?? 0}
        shelterCount={shelters.length}
        listedCount={facets?.stats.listed ?? 0}
        adoptedCount={facets?.stats.adopted ?? 0}
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
              {total}{' '}
              <span className="text-foreground/45">
                {total === 1 ? 'pet' : 'pets'} ready to meet
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
            onChange={changeFilter}
            onClear={clearOne}
            onReset={resetAll}
            activeCount={activeFilterCount}
            breeds={breeds}
            locations={locations}
            temperaments={temperaments}
          />
        </Reveal>

        <div className="mt-8">
          {loading && pagePets.length === 0 ? (
            <LoadingGrid count={6} />
          ) : error ? (
            <EmptyState title="Could not load pets" description={error} />
          ) : total === 0 ? (
            <EmptyState
              title="No pets match your filters"
              description="Try clearing a filter or searching for a different breed."
              icon="search"
              action={
                <Button variant="outline" size="sm" onClick={resetAll}>
                  Clear all filters
                </Button>
              }
            />
          ) : (
            <div
              key={facetSignature}
              className={cn(
                'grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3',
                loading && 'opacity-60',
              )}
            >
              {pagePets.map((pet, index) => (
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

        {/* Backend-owned paging: 10 pets per request, `total` from its meta. */}
        {total > 0 && (
          <div className="mt-8">
            <TablePagination
              currentPage={page}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={goToPage}
              showPageSize={false}
              label="pets"
            />
          </div>
        )}
      </Container>
    </div>
  );
};
