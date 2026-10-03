import { ArrowRight, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BlurText, GridOverlay, Reveal } from '@/components/shared';
import { ShelterPlate } from '@/components/features/ShelterPlate';
import { EmptyState, LoadingGrid } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import { useShelters } from '@/hooks/useData';

const frame = 'mx-auto w-full max-w-[1400px] px-6 lg:px-12';

export const SheltersPage = () => {
  const { shelters, loading } = useShelters();

  const totalPets = shelters.reduce((sum, s) => sum + s.totalPets, 0);
  const cities = new Set(shelters.map((s) => s.location)).size;
  const averagePets = shelters.length ? Math.round(totalPets / shelters.length) : 0;

  const stats = [
    { value: shelters.length || '—', label: 'partner rescues' },
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
              PawsConnect network
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
      <section className="bg-background py-20 md:py-28">
        <div className={frame}>
          <Reveal>
            <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
              Meet the rescues
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Contact details, visiting hours, and the pets currently in their care.
            </p>
          </Reveal>

          <div className="mt-14">
            {loading ? (
              <LoadingGrid count={3} />
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
            ) : (
              <div className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
                {shelters.map((shelter, i) => (
                  <Reveal key={shelter.id} delay={i * 90} className="h-full">
                    <ShelterPlate shelter={shelter} className="h-full" />
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
