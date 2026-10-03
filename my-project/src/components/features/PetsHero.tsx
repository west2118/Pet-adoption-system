import { ArrowDown, ArrowRight, BadgeCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Pet } from '@/types';
import { cn } from '@/lib/utils';
import { GridOverlay, BlurText, Reveal } from '@/components/shared';
import { Button } from '@/components/ui/button';

interface PetsHeroProps {
  /** Pets drawn on the orbit ring — the page orders these adoptable-first. */
  pets: Pet[];
  availableCount: number;
  shelterCount: number;
  listedCount: number;
  adoptedCount: number;
}

/**
 * The orbit is laid out on a shallow parabola rather than a true circle: a wide,
 * gentle dip that stays fully on screen at every breakpoint, so no card is ever
 * clipped by the section edge.
 */
const CARD_WIDTH = 176;
const CARD_HEIGHT = 236;
const ARC_SPACING = 152;
const ARC_DIP = 9;
const ARC_TILT = 5;
const ORBIT_COUNT = 9;
const STRIP_COUNT = 8;
const LISTINGS_ANCHOR = 'pet-listings';

/** Short status line for a card on the ring, in the hero's own voice. */
const statusNote: Record<Pet['status'], { label: string; tone: string }> = {
  Available: { label: 'Ready for a home', tone: 'text-primary' },
  'Pending Adoption': { label: 'Application pending', tone: 'text-amber-600' },
  Fostered: { label: 'In a foster home', tone: 'text-sky-600' },
  Adopted: { label: 'Already adopted', tone: 'text-muted-foreground' },
};

/** Centres a fixed-size card on the ring point for its index. */
const orbitStyle = (index: number, total: number) => {
  const offset = index - (total - 1) / 2;
  const span = (total - 1) / 2 || 1;
  const depth = Math.abs(offset) / span;

  return {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginLeft: -CARD_WIDTH / 2,
    marginTop: -CARD_HEIGHT / 2,
    transform: `translate3d(${offset * ARC_SPACING}px, ${offset * offset * ARC_DIP}px, 0) rotate(${-offset * ARC_TILT}deg) scale(${1 - depth * 0.16})`,
    opacity: 1 - depth * 0.34,
    zIndex: 10 - Math.round(depth * 6),
  };
};

export const PetsHero = ({
  pets,
  availableCount,
  shelterCount,
  listedCount,
  adoptedCount,
}: PetsHeroProps) => {
  const scrollToListings = () =>
    document
      .getElementById(LISTINGS_ANCHOR)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const orbitPets = pets.slice(0, ORBIT_COUNT);
  const stats = [
    { value: listedCount || '—', label: 'pets listed' },
    { value: shelterCount || '—', label: 'partner shelters' },
    { value: adoptedCount || '—', label: 'happy adoptions' },
  ];

  return (
    <section className="pets-hero relative overflow-hidden border-b border-border">
      {/* Background layers */}
      <div className="absolute inset-0" aria-hidden="true">
        <GridOverlay />
        <div className="pets-hero-stars absolute inset-0" />
        <div className="pets-hero-stars-far absolute inset-0 opacity-70" />
        {/* Warm glow orbs — the same treatment the landing hero uses. */}
        <div className="absolute -right-20 top-1/4 size-[36rem] rounded-full bg-[var(--brand)]/15 blur-[120px]" />
        <div className="absolute -left-20 bottom-10 size-[28rem] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col items-center px-6 pt-16 lg:px-12 lg:pt-24">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/10 px-3.5 py-1.5 font-mono text-xs font-medium tracking-wide text-primary">
            <BadgeCheck className="size-4 text-[var(--brand)]" />
            Verified shelters and rescues
          </span>
        </Reveal>

        <Reveal delay={100}>
          <h1 className="mt-8 max-w-4xl text-center font-display text-[clamp(2.5rem,6.5vw,5.5rem)] leading-[0.95] tracking-tight">
            <span className="block text-primary">{availableCount} pets are waiting.</span>
            <span className="block text-primary/45">One of them is yours.</span>
          </h1>
        </Reveal>

        <BlurText
          as="p"
          delay={200}
          className="mt-8 max-w-2xl text-center text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          Adoptable pets from shelters we have reviewed — real medical records, real
          behaviour notes, and a rescue waiting on you.
        </BlurText>

        <Reveal delay={300} className="mt-10">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={scrollToListings}
              className="h-12 rounded-full px-7 text-sm font-medium shadow-md transition-all hover:shadow-lg"
            >
              Browse the listings <ArrowDown className="size-4" />
            </Button>
            <Link to="/shelters">
              <Button
                variant="outline"
                className="h-12 rounded-full border-foreground/20 px-7 text-sm font-medium hover:bg-muted"
              >
                Meet shelters <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={380} className="w-full">
          <dl className="mt-14 flex flex-wrap items-start justify-center gap-x-14 gap-y-6 border-t border-border/60 pt-8">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <dt className="font-display text-3xl font-semibold text-primary lg:text-4xl">
                  {stat.value}
                </dt>
                <dd className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* Orbit — desktop. Cards sit on a wide, shallow arc beneath the stats. */}
        {orbitPets.length > 0 && (
          <div
            className="relative mt-4 hidden h-[420px] w-full lg:block"
            aria-label="Available pets"
          >
            {orbitPets.map((pet, index) => (
              <div
                key={pet.id}
                className="absolute left-1/2 top-[42%]"
                style={orbitStyle(index, orbitPets.length)}
              >
                <div
                  className="h-full w-full animate-pets-hero-float"
                  style={{ animationDelay: `${index * -1.4}s` }}
                >
                  <Link
                    to={`/pets/${pet.id}`}
                    className="group block h-full w-full overflow-hidden rounded-xl border border-border bg-card shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                  >
                    <img
                      src={pet.imageUrl}
                      alt={pet.name}
                      loading="lazy"
                      className="h-[136px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="p-3">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {pet.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs capitalize text-muted-foreground">
                        {pet.species} · {pet.breed}
                      </p>
                      <p
                        className={cn(
                          'mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider',
                          statusNote[pet.status].tone,
                        )}
                      >
                        <Sparkles className="size-3" />
                        {statusNote[pet.status].label}
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Orbit — mobile/tablet. A plain scroll strip, because the arc needs width. */}
        {orbitPets.length > 0 && (
          <div className="-mx-6 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-6 lg:hidden">
            {orbitPets.slice(0, STRIP_COUNT).map((pet) => (
              <Link
                key={pet.id}
                to={`/pets/${pet.id}`}
                className="w-[172px] shrink-0 snap-center overflow-hidden rounded-xl border border-border bg-card shadow-md"
              >
                <img
                  src={pet.imageUrl}
                  alt={pet.name}
                  loading="lazy"
                  className="h-[124px] w-full object-cover"
                />
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-foreground">{pet.name}</p>
                  <p className="mt-0.5 truncate text-xs capitalize text-muted-foreground">
                    {pet.species} · {pet.breed}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
