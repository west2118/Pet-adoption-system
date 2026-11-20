import { ArrowRight, HeartHandshake, LayoutGrid, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BlurText, ErrorState, GridOverlay, Reveal, TablePagination } from '@/components/shared';
import { ShelterPlate } from '@/components/features/ShelterPlate';
import { ShelterGeoMap } from '@/components/features/ShelterGeoMap';
import { EmptyState, LoadingGrid } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import { useShelterStats, useSheltersPage } from '@/hooks/useData';

const frame = 'mx-auto w-full max-w-[1400px] px-6 lg:px-12';

export const SheltersPage = () => {
  // The directory is paged by the backend (10 rescues per request); the header
  // numbers come from its stats endpoint so they still cover the whole network.
  const { shelters, total, pageSize, page, setPage, loading, error, refresh } =
    useSheltersPage();
  const networkStats = useShelterStats();
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const totalPets = networkStats?.petsInCare ?? 0;
  const cities = networkStats?.cities ?? 0;
  const averagePets = networkStats?.total ? Math.round(totalPets / networkStats.total) : 0;

  const stats = [
    { value: networkStats?.total || '—', label: 'partner rescues' },
    { value: cities || '—', label: 'cities covered' },
    { value: totalPets || '—', label: 'pets in care' },
    { value: averagePets || '—', label: 'average pets per rescue' },
  ];

  return (
    <div className="landing-theme">
      {/* ------------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden bg-background py-20 md:py-28 lg:py-36">
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <GridOverlay />
          <div className="absolute -right-20 top-1/4 size-[36rem] rounded-full bg-[var(--brand)]/15 blur-[120px] pointer-events-none" />
          <div className="absolute -left-20 bottom-10 size-[28rem] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        </div>

        <div className={`relative z-10 ${frame}`}>
          <Reveal>
            <p className="text-center font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              Paws&amp;Homes network
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 text-center font-display text-[clamp(2.75rem,8vw,7rem)] leading-[0.9] tracking-tight">
              <span className="block text-primary">Shelters</span>
              <span className="block">&amp; rescues</span>
            </h1>
          </Reveal>

          <BlurText
            as="p"
            delay={200}
            className="mx-auto mt-10 max-w-3xl justify-center text-center text-2xl leading-relaxed text-muted-foreground md:text-3xl"
          >
            Every partner here is verified, transparent about how they operate, and ready to
            walk you through a match.
          </BlurText>
        </div>
      </section>

      {/* ------------------------------------------------------------ STATS */}
      <section className="border-y border-border bg-background">
        <div className={`grid grid-cols-2 md:grid-cols-4 ${frame}`}>
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={[
                'px-2 py-10 text-center md:px-4 md:py-14',
                i % 2 === 1 ? 'border-l border-border' : '',
                i >= 2 ? 'border-t border-border md:border-t-0' : '',
                'md:border-l md:first:border-l-0',
              ].join(' ')}
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-3 font-display text-4xl tracking-tight text-foreground md:text-5xl">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- DIRECTORY */}
      <section id="rescue-directory" className="scroll-mt-24 bg-background py-20 md:py-28">
        <div className={frame}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Reveal>
              <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
                Meet the rescues
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Contact details, visiting hours, and the pets currently in their care.
              </p>
            </Reveal>

            {/* View switcher: Grid vs Map */}
            <div className="flex items-center rounded-full border border-border bg-card p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="size-3.5" />
                <span>List view</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  viewMode === 'map'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MapPin className="size-3.5" />
                <span>Geo Map</span>
              </button>
            </div>
          </div>

          <div className="mt-14">
            {loading ? (
              <LoadingGrid count={3} />
            ) : error ? (
              <ErrorState
                title="Could not load shelters"
                description={error}
                onRetry={refresh}
              />
            ) : shelters.length === 0 ? (
              <EmptyState
                title="No partner shelters yet"
                description="We are onboarding rescues across the country."
                action={
                  <Link to="/pets">
                    <Button className="h-11 rounded-full px-7 text-[15px]">
                      Browse pets
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                }
              />
            ) : viewMode === 'map' ? (
              /* ----------------- Geo Map Layout for Shelters ----------------- */
              <div className="grid gap-8 lg:grid-cols-2">
                {shelters.map((shelter, i) => (
                  <Reveal key={shelter.id} delay={i * 60} className="h-full">
                    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-medium tracking-tight">
                            <Link
                              to={`/shelters/${shelter.id}`}
                              className="transition-colors hover:text-primary"
                            >
                              {shelter.name}
                            </Link>
                          </h3>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0 text-primary" />
                            {shelter.address || shelter.location}
                          </p>
                        </div>
                        <Link to={`/shelters/${shelter.id}`}>
                          <Button size="sm" variant="outline" className="h-8 rounded-full text-xs">
                            View profile
                          </Button>
                        </Link>
                      </div>

                      {/* Interactive Geo Map embed */}
                      <div className="mt-4 flex-1">
                        <ShelterGeoMap
                          shelter={shelter}
                          height={220}
                          showCardHeader={false}
                        />
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            ) : (
              /* ----------------- Standard Grid Layout ----------------- */
              <div className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
                {shelters.map((shelter, i) => (
                  <Reveal key={shelter.id} delay={i * 90} className="h-full">
                    <ShelterPlate shelter={shelter} className="h-full" />
                  </Reveal>
                ))}
              </div>
            )}
          </div>

          {/* Backend-owned paging: 10 rescues per request, `total` from its meta. */}
          {total > 12 && (
            <div className="mt-14">
              <TablePagination
                currentPage={page}
                totalItems={total}
                pageSize={pageSize}
                onPageChange={(next) => {
                  setPage(next);
                  document
                    .getElementById('rescue-directory')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                showPageSize={false}
                label="rescues"
              />
            </div>
          )}
        </div>
      </section>

      {/* --------------------------------------------------------------- CTA */}
      <section className="relative overflow-hidden bg-[var(--brand-tint)] py-16 md:py-24">
        <div className={frame}>
          <Reveal className="text-center">
            <HeartHandshake className="mx-auto size-8 text-primary" />
            <h2 className="mx-auto mt-6 max-w-3xl font-display text-3xl leading-tight tracking-tight md:text-5xl">
              Ready to meet your next companion?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
              Browse adoptable pets by city, save your favourites, and send an application
              directly to the rescue caring for them.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link to="/pets">
                <Button size="lg" className="h-11 rounded-full px-7 text-[15px]">
                  Browse pets
                  <ArrowRight data-slot="icon" />
                </Button>
              </Link>
              <Link to="/apply">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 rounded-full px-7 text-[15px]"
                >
                  Start an application
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};
