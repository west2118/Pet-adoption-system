import { Heart, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Pet, Shelter } from '@/types';
import { BlurText, GridOverlay, Reveal } from '@/components/shared';
import { PetStatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { capitalize, formatAge } from '@/utils/formatters';
import { PetGallery } from '@/components/features/PetGallery';

interface PetHeroProps {
  pet: Pet;
  shelter?: Shelter;
  favorite: boolean;
  onToggleFavorite: () => void;
}

/** 1400px content frame — the same measure the landing, pets and shelters pages use. */
const frame = 'mx-auto w-full max-w-[1400px] px-6 lg:px-12';

/**
 * Pet masthead. Same editorial split as the shelter profile hero and the landing
 * spotlight card: oversized serif name against a portrait plate, a mono eyebrow,
 * and the key numbers set large so they read as facts rather than metadata.
 */
export const PetHero = ({ pet, shelter, favorite, onToggleFavorite }: PetHeroProps) => {
  const adopted = pet.status === 'Adopted';

  return (
    <section className="relative overflow-hidden bg-background py-14 md:py-20 lg:py-24">
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <GridOverlay />
        <div className="pointer-events-none absolute -right-20 top-1/4 size-[36rem] rounded-full bg-[var(--brand)]/15 blur-[120px]" />
        <div className="pointer-events-none absolute -left-20 bottom-10 size-[28rem] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className={`relative z-10 ${frame}`}>
        <Reveal className="mb-8">
          <Link
            to="/pets"
            className="group inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="h-px w-8 bg-current transition-all duration-300 group-hover:w-12" />
            Back to all pets
          </Link>
        </Reveal>

        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <PetGallery images={pet.gallery} name={pet.name} />
          </Reveal>

          <div className="lg:col-span-5">
            <Reveal>
              <div className="flex flex-wrap items-center gap-3">
                <PetStatusBadge status={pet.status} />
                {shelter && (
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {shelter.location}
                  </span>
                )}
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-6 font-display text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.9] tracking-tight">
                <span className="block text-primary">{pet.name}</span>
              </h1>
              <p className="mt-3 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                {pet.breed} · {pet.species}
              </p>
            </Reveal>

            <BlurText
              as="p"
              delay={200}
              className="mt-8 max-w-xl justify-start text-lg leading-relaxed text-muted-foreground"
            >
              {pet.description}
            </BlurText>

            <Reveal delay={300} className="mt-10">
              <div className="flex flex-wrap items-center gap-3">
                <Link to={`/apply/${pet.id}`}>
                  <Button
                    size="lg"
                    disabled={adopted}
                    className="h-12 rounded-full px-7 text-sm font-medium shadow-md transition-all hover:shadow-lg"
                  >
                    Apply to adopt
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onToggleFavorite}
                  aria-pressed={favorite}
                  aria-label={favorite ? `Remove ${pet.name} from favorites` : `Save ${pet.name} to favorites`}
                  className={cn(
                    'h-12 rounded-full border-foreground/20 px-6 text-sm font-medium hover:bg-muted',
                    favorite && 'border-red-200 text-red-500',
                  )}
                >
                  <Heart className={cn('size-4', favorite && 'fill-red-500')} />
                  {favorite ? 'Saved' : 'Save'}
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {adopted
                  ? `${pet.name} has already been adopted. You can still send an inquiry to the shelter.`
                  : pet.status === 'Available'
                    ? `${pet.name} is ready for adoption. Applications usually take 1–2 days to review.`
                    : `Current status: ${pet.status}. You can still inquire about ${pet.name}.`}
              </p>
            </Reveal>

            <Reveal delay={400} className="mt-12 border-t border-border/60 pt-8">
              <dl className="flex flex-wrap items-start gap-x-12 gap-y-7">
                <div className="flex flex-col gap-1">
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Age
                  </dt>
                  <dd className="font-display text-4xl font-semibold text-primary">
                    {formatAge(pet.ageYears).replace(' years old', ' yrs').replace(' year old', ' yr')}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Size
                  </dt>
                  <dd className="font-display text-4xl font-semibold capitalize text-primary">
                    {pet.size}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Gender
                  </dt>
                  <dd className="font-display text-4xl font-semibold capitalize text-primary">
                    {pet.gender}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Life stage
                  </dt>
                  <dd className="font-display text-4xl font-semibold text-primary">
                    {pet.ageGroup === 'puppy-kitten' ? 'Pup / Kitten' : capitalize(pet.ageGroup)}
                  </dd>
                </div>
              </dl>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};
