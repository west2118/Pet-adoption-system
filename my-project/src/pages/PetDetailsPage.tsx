import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, HeartHandshake } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { Pet, Shelter } from '@/types';
import { Reveal } from '@/components/shared';
import { Container } from '@/components/layout/Container';
import { InquiryForm } from '@/components/features/InquiryForm';
import { PetCard } from '@/components/features/PetCard';
import { PetFactStrip, PetRecords } from '@/components/features/PetRecords';
import { PetHero } from '@/components/features/PetHero';
import { ShelterContactCard } from '@/components/features/ShelterContactCard';
import { EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { petService, shelterService } from '@/services/api';
import { publicPets } from '@/data/mockData';
import { formatDate } from '@/utils/formatters';

const frame = 'mx-auto w-full max-w-[1400px] px-6 lg:px-12';

export const PetDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [shelter, setShelter] = useState<Shelter | null>(null);
  const [siblings, setSiblings] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      const found = await petService.getById(id);
      const shelters = await shelterService.list();
      const allPets = found ? await petService.list() : [];
      if (!mounted) return;
      setPet(found ?? null);
      setShelter(shelters.find((s) => s.id === found?.shelterId) ?? null);
      // Adopters only ever see other public listings from the same shelter.
      setSiblings(
        found
          ? publicPets(allPets)
              .filter((p) => p.shelterId === found.shelterId && p.id !== found.id)
              .slice(0, 3)
          : [],
      );
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const favorite = pet ? isFavorite(pet.id) : false;

  const handleToggleFavorite = () => {
    if (!pet) return;
    const wasFavorite = favorite;
    toggleFavorite(pet.id);
    if (wasFavorite) {
      toast.info(`${pet.name} removed from favorites.`);
    } else {
      toast.success(`${pet.name} saved to favorites!`);
    }
  };

  const shelterPetCount = useMemo(
    () => (siblings.length > 0 && pet ? siblings.length + 1 : pet ? 1 : 0),
    [siblings, pet],
  );

  if (loading) {
    return (
      <Container className="py-10">
        <div className="grid animate-pulse gap-10 lg:grid-cols-12">
          <div className="h-[560px] rounded-lg bg-muted lg:col-span-7" />
          <div className="space-y-5 lg:col-span-5">
            <div className="h-6 w-40 rounded bg-muted" />
            <div className="h-16 w-full rounded bg-muted" />
            <div className="h-24 w-full rounded bg-muted" />
            <div className="h-12 w-56 rounded bg-muted" />
          </div>
        </div>
      </Container>
    );
  }

  if (!pet) {
    return (
      <Container className="py-16">
        <EmptyState
          title="Pet not found"
          description="This listing may have been removed or adopted."
          action={
            <Link to="/pets">
              <Button size="sm">Back to browse</Button>
            </Link>
          }
        />
      </Container>
    );
  }

  if (pet.visibility === 'private') {
    return (
      <Container className="py-16">
        <EmptyState
          title="This pet is not available"
          description="Private shelter records are not visible to the public."
          action={
            <Link to="/pets">
              <Button size="sm">Back to browse</Button>
            </Link>
          }
        />
      </Container>
    );
  }

  return (
    <div className="landing-theme">
      <PetHero
        pet={pet}
        shelter={shelter ?? undefined}
        favorite={favorite}
        onToggleFavorite={handleToggleFavorite}
      />

      <div className="border-y border-border bg-background">
        <div className={frame}>
          <PetFactStrip pet={pet} />
        </div>
      </div>

      {/* ------------------------------------------------------ ABOUT + RECORDS */}
      <section className="bg-background py-20 md:py-28">
        <div className={frame}>
          <Reveal className="mb-14 max-w-3xl">
            <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
              <span className="h-px w-12 bg-[var(--brand)]" />
              About {pet.name}
            </span>
            <h2 className="font-display text-5xl leading-[0.92] tracking-tight md:text-6xl">
              <span className="block text-primary">Everything you need</span>
              <span className="block text-primary/45">before you decide.</span>
            </h2>
            <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
              {pet.name} is a {pet.ageGroup === 'puppy-kitten' ? 'young' : pet.ageGroup}{' '}
              {pet.breed} listed by {shelter?.name ?? 'our partner shelters'} on{' '}
              {formatDate(pet.dateAdded)}. Every record below is published by the shelter
              and can be verified with them directly.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <PetRecords pet={pet} />
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------- SHELTER + INQUIRY */}
      <section className="border-t border-border bg-background py-20 md:py-28">
        <div className={frame}>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              {shelter ? (
                <>
                  <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
                    <span className="h-px w-12 bg-[var(--brand)]" />
                    Where {pet.name} is
                  </span>
                  <h2 className="font-display text-4xl leading-[0.95] tracking-tight md:text-5xl">
                    <span className="block text-primary">{shelter.name}</span>
                    <span className="block text-primary/45">{shelter.location}</span>
                  </h2>
                  <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                    {shelter.description}
                  </p>

                  <ShelterContactCard shelter={shelter} className="mt-8" />

                  <Link
                    to={`/shelters/${shelter.id}`}
                    className="group mt-8 inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-primary transition-colors hover:text-primary/75"
                  >
                    View shelter profile
                    <span className="h-px w-8 bg-current transition-all duration-300 group-hover:w-12" />
                  </Link>
                </>
              ) : (
                <EmptyState
                  title="Shelter unavailable"
                  description="This listing is not linked to a partner shelter yet."
                />
              )}
            </Reveal>

            <Reveal delay={150} className="lg:col-span-7">
              <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
                <span className="h-px w-12 bg-[var(--brand)]" />
                Ask the shelter
              </span>
              <h2 className="font-display text-4xl leading-[0.95] tracking-tight md:text-5xl">
                <span className="block text-primary">Questions before</span>
                <span className="block text-primary/45">you visit?</span>
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                Send a direct message to {shelter?.name ?? 'the shelter'} about{' '}
                {pet.name} — meet-and-greets, medical history, or anything else you
                would like to know.
              </p>
              <div className="mt-10">
                <InquiryForm petName={pet.name} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- MORE FROM THE SHELTER */}
      {siblings.length > 0 && shelter && (
        <section className="border-t border-border bg-background py-20 md:py-28">
          <div className={frame}>
            <div className="mb-14 grid gap-8 lg:grid-cols-12 lg:items-end">
              <Reveal className="lg:col-span-7">
                <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
                  <span className="h-px w-12 bg-[var(--brand)]" />
                  Also in their care
                </span>
                <h2 className="font-display text-5xl leading-[0.92] tracking-tight md:text-6xl">
                  <span className="block text-primary">More from</span>
                  <span className="block text-primary/45">{shelter.location}.</span>
                </h2>
              </Reveal>

              <Reveal delay={150} className="lg:col-span-5 lg:pb-2">
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {shelter.name} currently has {shelterPetCount}{' '}
                  {shelterPetCount === 1 ? 'public listing' : 'public listings'} on
                  PawsConnect.
                </p>
                <Link
                  to={`/pets?location=${encodeURIComponent(shelter.location)}`}
                  className="group mt-8 inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-primary transition-colors hover:text-primary/75"
                >
                  Browse {shelter.location}
                  <span className="h-px w-8 bg-current transition-all duration-300 group-hover:w-12" />
                </Link>
              </Reveal>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {siblings.map((sibling, index) => (
                <Reveal key={sibling.id} delay={Math.min(index, 8) * 70}>
                  <PetCard
                    pet={sibling}
                    className="h-full"
                    shelterLocation={shelter.location}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ CTA */}
      <section className="relative overflow-hidden bg-[var(--brand-tint)] py-16 md:py-24">
        <div className={frame}>
          <Reveal className="text-center">
            <HeartHandshake className="mx-auto size-8 text-primary" />
            <h2 className="mx-auto mt-6 max-w-3xl font-display text-3xl leading-tight tracking-tight md:text-5xl">
              {pet.status === 'Adopted'
                ? `${pet.name} has already found a home`
                : `Ready to bring ${pet.name} home?`}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
              {pet.status === 'Adopted'
                ? 'You can still browse other rescues looking for a home, or send the shelter an inquiry.'
                : 'Send an adoption application online and follow every step from Submitted to Adopted, all in one place.'}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {pet.status === 'Adopted' ? (
                <Link to="/pets">
                  <Button size="lg" className="h-11 rounded-full px-7 text-[15px]">
                    Browse other pets
                    <ArrowRight data-slot="icon" />
                  </Button>
                </Link>
              ) : (
                <Link to={`/apply/${pet.id}`}>
                  <Button size="lg" className="h-11 rounded-full px-7 text-[15px]">
                    Apply to adopt
                    <ArrowRight data-slot="icon" />
                  </Button>
                </Link>
              )}
              <Link to="/pets">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 rounded-full px-7 text-[15px]"
                >
                  Keep browsing
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};
