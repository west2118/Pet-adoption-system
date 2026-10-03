import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { Pet, Shelter } from '@/types';
import { Reveal } from '@/components/shared';
import { Container } from '@/components/layout/Container';
import { ShelterContactCard } from '@/components/features/ShelterContactCard';
import { ShelterProfileHero } from '@/components/features/ShelterProfileHero';
import { PetCard } from '@/components/features/PetCard';
import { EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import { petService, shelterService } from '@/services/api';
import { publicPets } from '@/data/mockData';
import { cn } from '@/lib/utils';

const frame = 'mx-auto w-full max-w-[1400px] px-6 lg:px-12';
const PETS_ANCHOR = 'shelter-pets';

export const ShelterPublicProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const [shelter, setShelter] = useState<Shelter | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const found = await shelterService.getById(id);
        // Adopters only ever see public listings — private inventory stays hidden.
        const allPets = found ? await petService.list() : [];
        if (!mounted) return;
        setShelter(found ?? null);
        setPets(found ? publicPets(allPets).filter((p) => p.shelterId === found.id) : []);
      } catch {
        if (mounted) setError('Failed to load this shelter. Please try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const availableCount = useMemo(
    () => pets.filter((pet) => pet.status === 'Available').length,
    [pets],
  );

  const speciesBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    pets.forEach((pet) => counts.set(pet.species, (counts.get(pet.species) ?? 0) + 1));
    if (counts.size === 0) return '—';
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([species, count]) => `${count} ${species}${count === 1 ? '' : 's'}`)
      .join(' · ');
  }, [pets]);

  const visitingDays = useMemo(() => {
    if (!shelter) return '—';
    // "Mon–Sat, 9:00 AM – 6:00 PM" → "Mon–Sat". Split on the first comma, not the
    // first dash, otherwise the dash inside the day range truncates it.
    const days = shelter.operatingHours.split(',')[0].trim();
    return days || '—';
  }, [shelter]);

  if (loading) {
    return (
      <Container className="py-10">
        <div className="grid animate-pulse gap-8 lg:grid-cols-2">
          <div className="h-80 rounded-lg bg-muted" />
          <div className="space-y-4">
            <div className="h-6 w-32 rounded bg-muted" />
            <div className="h-16 w-full rounded bg-muted" />
            <div className="h-24 w-full rounded bg-muted" />
          </div>
        </div>
      </Container>
    );
  }

  if (error || !shelter) {
    return (
      <Container className="py-16">
        <EmptyState
          title="Shelter not found"
          description={
            error ??
            'This shelter may no longer be a verified partner on PawsConnect.'
          }
          action={
            <Link to="/shelters">
              <Button size="sm">Back to shelters</Button>
            </Link>
          }
        />
      </Container>
    );
  }

  // `totalPets` is the shelter's own headline figure; everything else below is
  // derived from live public listings, so the two are labelled distinctly.
  const stats = [
    { value: shelter.totalPets || '—', label: 'pets in care' },
    { value: pets.length || '—', label: 'listed publicly' },
    { value: availableCount || '—', label: 'available now' },
    { value: visitingDays, label: 'visiting days' },
  ];

  return (
    <div className="landing-theme">
      <ShelterProfileHero
        shelter={shelter}
        availableCount={availableCount}
        petsAnchor={PETS_ANCHOR}
      />

      {/* ------------------------------------------------------------ STATS BAND */}
      <section className="border-y border-border bg-background">
        <div className={`grid grid-cols-2 md:grid-cols-4 ${frame}`}>
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                'px-2 py-10 text-center md:px-4 md:py-12',
                i % 2 === 1 ? 'border-l border-border' : '',
                i >= 2 ? 'border-t border-border md:border-t-0' : '',
                'md:border-l md:first:border-l-0',
              )}
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

      {/* -------------------------------------------------------- ABOUT + CONTACT */}
      <section className="bg-background py-20 md:py-28">
        <div className={frame}>
          <div className="grid gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
                <span className="h-px w-12 bg-[var(--brand)]" />
                About the rescue
              </span>
              <h2 className="font-display text-5xl leading-[0.92] tracking-tight md:text-6xl">
                <span className="block text-primary">Why we</span>
                <span className="block text-primary/45">partner with them.</span>
              </h2>
              <div className="mt-8 space-y-5 text-lg leading-relaxed text-muted-foreground">
                <p>{shelter.description}</p>
                <p>
                  Every animal published by {shelter.name} carries its medical and
                  behavioural history on the listing, so you can read the full picture
                  before you visit. Applications submitted here go straight to the
                  shelter team.
                </p>
                <p className="flex items-center gap-2 text-foreground">
                  <MapPin className="size-4 shrink-0 text-primary" />
                  {shelter.address}
                </p>
              </div>
            </Reveal>

            <Reveal delay={150} className="lg:col-span-5">
              <h3 className="font-display text-3xl tracking-tight">Get in touch</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Visiting hours, phone, and email for {shelter.name}. Walk-ins welcome
                during opening hours — please call ahead for same-day meet and greets.
              </p>
              <ShelterContactCard shelter={shelter} className="mt-8" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- THEIR PETS */}
      <section id={PETS_ANCHOR} className="scroll-mt-28 border-t border-border bg-background py-20 md:py-28">
        <div className={frame}>
          <div className="mb-14 grid gap-8 lg:grid-cols-12 lg:items-end">
            <Reveal className="lg:col-span-7">
              <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
                <span className="h-px w-12 bg-[var(--brand)]" />
                Their pets
              </span>
              <h2 className="font-display text-5xl leading-[0.92] tracking-tight md:text-6xl">
                <span className="block text-primary">
                  {availableCount > 0 ? `${availableCount} available` : 'Currently listed'}
                </span>
                <span className="block text-primary/45">right now.</span>
              </h2>
            </Reveal>

            <Reveal delay={150} className="lg:col-span-5 lg:pb-2">
              <p className="text-lg leading-relaxed text-muted-foreground">
                {pets.length === 0
                  ? `${shelter.name} has no public listings at the moment. New arrivals are added every week.`
                  : `${speciesBreakdown} in ${shelter.location}. Private shelter records are never shown here.`}
              </p>
              <Link
                to={`/pets?location=${encodeURIComponent(shelter.location)}`}
                className="group mt-8 inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-primary transition-colors hover:text-primary/75"
              >
                Browse all listings
                <span className="h-px w-8 bg-current transition-all duration-300 group-hover:w-12" />
              </Link>
            </Reveal>
          </div>

          {pets.length === 0 ? (
            <EmptyState
              title="No public listings right now"
              description={`${shelter.name} keeps its private inventory separate from the public catalogue.`}
              icon="paw"
              action={
                <Link to="/pets">
                  <Button variant="outline" size="sm">
                    Browse all pets
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pets.map((pet, index) => (
                <Reveal key={pet.id} delay={Math.min(index, 8) * 70}>
                  <PetCard
                    pet={pet}
                    className="h-full"
                    shelterLocation={shelter.location}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------- CTA */}
      <section className="relative overflow-hidden bg-[var(--brand-tint)] py-16 md:py-24">
        <div className={frame}>
          <Reveal className="text-center">
            <h2 className="mx-auto mt-6 max-w-3xl font-display text-3xl leading-tight tracking-tight md:text-5xl">
              Ready to meet your next companion?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
              Save your favourites, send an adoption application online, and follow every
              step from Submitted to Adopted.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link to="/pets">
                <Button size="lg" className="h-11 rounded-full px-7 text-[15px]">
                  Browse all pets
                  <ArrowRight data-slot="icon" />
                </Button>
              </Link>
              <a href={`mailto:${shelter.email}`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 rounded-full px-7 text-[15px]"
                >
                  Email {shelter.location}
                </Button>
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};
