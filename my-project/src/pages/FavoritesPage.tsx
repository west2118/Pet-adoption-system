import { useMemo } from 'react';
import { ArrowRight, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BlurText, GridOverlay, Reveal } from '@/components/shared';
import { PetCard } from '@/components/features/PetCard';
import { EmptyState, LoadingGrid } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { usePets, useShelters } from '@/hooks/useData';
import { publicPets } from '@/data/mockData';

const frame = 'mx-auto w-full max-w-[1400px] px-6 lg:px-12';

export const FavoritesPage = () => {
  const { favorites, loading: favoritesLoading } = useFavorites();
  const { pets, loading } = usePets();
  const { shelters } = useShelters();
  const listLoading = loading || favoritesLoading;

  const locationByShelter = useMemo(
    () => new Map(shelters.map((s) => [s.id, s.location])),
    [shelters],
  );

  const saved = useMemo(
    () => publicPets(pets).filter((p) => favorites.includes(p.id)),
    [pets, favorites],
  );

  const shelterIds = useMemo(() => new Set(saved.map((p) => p.shelterId)), [saved]);
  const locations = useMemo(
    () => new Set(saved.map((p) => locationByShelter.get(p.shelterId)).filter(Boolean)),
    [saved, locationByShelter],
  );

  const stats = [
    { value: saved.length || '—', label: 'pets saved' },
    {
      value: saved.filter((p) => p.status === 'Available').length || '—',
      label: 'available now',
    },
    { value: shelterIds.size || '—', label: 'shelters represented' },
    { value: locations.size || '—', label: 'cities covered' },
  ];

  return (
    <div className="landing-theme">
      {/* ------------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden bg-background py-20 md:py-28 lg:py-32">
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <GridOverlay />
          <div className="absolute -right-20 top-1/4 size-[36rem] rounded-full bg-[var(--brand)]/15 blur-[120px] pointer-events-none" />
          <div className="absolute -left-20 bottom-10 size-[28rem] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        </div>

        <div className={`relative z-10 ${frame}`}>
          <Reveal>
            <p className="text-center font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              Your watchlist
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 text-center font-display text-[clamp(2.75rem,8vw,7rem)] leading-[0.9] tracking-tight">
              <span className="block text-primary">Saved</span>
              <span className="block">favorites</span>
            </h1>
          </Reveal>

          <BlurText
            as="p"
            delay={200}
            className="mx-auto mt-10 max-w-3xl justify-center text-center text-2xl leading-relaxed text-muted-foreground md:text-3xl"
          >
            The pets you keep coming back to. Send an application when the right one finds you.
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

      {/* -------------------------------------------------------- SHORTLIST */}
      <section className="bg-background py-20 md:py-28">
        <div className={frame}>
          <Reveal>
            <span className="inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
              <span className="h-px w-12 bg-[var(--brand)]" />
              Shortlist
            </span>

            <h2 className="mt-6 font-display text-[clamp(2rem,4vw,3.25rem)] leading-[0.95] tracking-tight">
              {listLoading ? (
                'Gathering your pets…'
              ) : (
                <>
                  {saved.length}{' '}
                  <span className="text-foreground/45">
                    {saved.length === 1 ? 'pet' : 'pets'} on your list
                  </span>
                </>
              )}
            </h2>

            <p className="mt-3 text-sm text-muted-foreground">
              Tap the heart on any pet to add or remove it from your watchlist.
            </p>
          </Reveal>

          <div className="mt-12">
            {listLoading ? (
              <LoadingGrid count={6} />
            ) : saved.length === 0 ? (
              <EmptyState
                title="No favorites saved"
                description="Tap the heart on any pet to add it to your watchlist."
                action={
                  <Link to="/pets">
                    <Button className="h-11 rounded-full px-7 text-[15px]">
                      Browse pets
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {saved.map((pet, index) => (
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
        </div>
      </section>

      {/* --------------------------------------------------------------- CTA */}
      <section className="relative overflow-hidden bg-[var(--brand-tint)] py-16 md:py-24">
        <div className={frame}>
          <Reveal className="text-center">
            <Heart className="mx-auto size-8 text-primary" />
            <h2 className="mx-auto mt-6 max-w-3xl font-display text-3xl leading-tight tracking-tight md:text-5xl">
              Keep looking — there is always another match.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
              Hundreds of adoptable animals are waiting across our partner rescues. Save the
              ones you love and we will keep them here for you.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link to="/pets">
                <Button size="lg" className="h-11 rounded-full px-7 text-[15px]">
                  Browse pets
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/shelters">
                <Button size="lg" variant="outline" className="h-11 rounded-full px-7 text-[15px]">
                  Meet the rescues
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};
