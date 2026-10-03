import { ArrowDown, BadgeCheck, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Shelter } from '@/types';
import { BlurText, GridOverlay, Reveal } from '@/components/shared';
import { Button } from '@/components/ui/button';

interface ShelterProfileHeroProps {
  shelter: Shelter;
  /** Live count of public listings — drives the primary CTA label. */
  availableCount: number;
  /** Id of the pets section, so the CTA can scroll to it. */
  petsAnchor: string;
}

/** 1400px content frame — the same measure the landing and shelters heroes use. */
const frame = 'mx-auto w-full max-w-[1400px] px-6 lg:px-12';

/**
 * Shelter masthead. Follows the shelters page hero — `GridOverlay`, the two warm
 * orbs, a mono eyebrow, an oversized `font-display` name with the location dimmed,
 * and a `BlurText` lede — but adds the big image plate the shelters directory
 * card already shows.
 */
export const ShelterProfileHero = ({
  shelter,
  availableCount,
  petsAnchor,
}: ShelterProfileHeroProps) => {
  const scrollToPets = () =>
    document.getElementById(petsAnchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <section className="relative overflow-hidden bg-background py-16 md:py-24 lg:py-28">
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <GridOverlay />
        <div className="pointer-events-none absolute -right-20 top-1/4 size-[36rem] rounded-full bg-[var(--brand)]/15 blur-[120px]" />
        <div className="pointer-events-none absolute -left-20 bottom-10 size-[28rem] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className={`relative z-10 ${frame}`}>
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Image plate */}
          <Reveal className="order-2 lg:order-1 lg:col-span-6">
            <div className="relative">
              <div className="absolute left-1/2 top-1/2 -z-10 size-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-[var(--brand)]/30 via-amber-400/15 to-primary/10 blur-3xl" />
              <img
                src={shelter.imageUrl}
                alt={`${shelter.name} — animals in their care`}
                className="aspect-[4/5] w-full rounded-lg border border-border object-cover shadow-xl"
              />
            </div>
          </Reveal>

          {/* Type-led column */}
          <div className="order-1 lg:order-2 lg:col-span-6">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/10 px-3.5 py-1.5 font-mono text-xs font-medium tracking-wide text-primary">
                <BadgeCheck className="size-4 text-[var(--brand)]" />
                Verified partner rescue
              </span>
            </Reveal>

            <Reveal delay={80}>
              <p className="mt-6 font-mono text-sm uppercase tracking-[0.24em] text-muted-foreground">
                {shelter.location}
              </p>
              <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,6rem)] leading-[0.92] tracking-tight">
                <span className="block text-primary">{shelter.name}</span>
              </h1>
            </Reveal>

            <BlurText
              as="p"
              delay={200}
              className="mt-8 max-w-xl justify-start text-lg leading-relaxed text-muted-foreground"
            >
              {shelter.description}
            </BlurText>

            <Reveal delay={320} className="mt-10">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  onClick={scrollToPets}
                  className="h-12 rounded-full px-7 text-sm font-medium shadow-md transition-all hover:shadow-lg"
                >
                  {availableCount > 0
                    ? `View ${availableCount} available pet${availableCount === 1 ? '' : 's'}`
                    : 'View their listings'}
                  <ArrowDown className="size-4" />
                </Button>
                <a href={`mailto:${shelter.email}`}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 rounded-full border-foreground/20 px-7 text-sm font-medium hover:bg-muted"
                  >
                    <Mail className="size-4" /> Email the shelter
                  </Button>
                </a>
              </div>
            </Reveal>

            <Reveal delay={400} className="mt-10 border-t border-border/60 pt-6">
              <p className="text-sm text-muted-foreground">
                Prefer to browse everything at once?{' '}
                <Link
                  to={`/pets?location=${encodeURIComponent(shelter.location)}`}
                  className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
                >
                  See all {shelter.location} listings
                </Link>
                .
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};
