import { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck,
  ChevronRight,
  FileCheck2,
  HeartHandshake,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { GridOverlay, Reveal } from '@/components/shared';
import { PetCard } from '@/components/features/PetCard';
import { ShelterCard } from '@/components/features/ShelterCard';
import { EmptyState, LoadingGrid } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import { usePets, useShelters } from '@/hooks/useData';
import { publicPets } from '@/data/mockData';
import { formatAge } from '@/utils/formatters';
import heroDogsGroupImg from '@/assets/landing-page/Firefly (2).png';

/** 1400px content frame — matches the reference's editorial measure. */
const frame = 'mx-auto w-full max-w-[1400px] px-6 lg:px-12';

interface Step {
  id: string;
  icon: LucideIcon;
  verb: string;
  title: string;
  text: string;
}

const steps: Step[] = [
  {
    id: 'browse',
    icon: Search,
    verb: 'Browse',
    title: 'find your match',
    text: 'Filter by species, breed, age, size, gender, temperament, and shelter location. Every listing shows verified medical and behavioural records up front.',
  },
  {
    id: 'apply',
    icon: FileCheck2,
    verb: 'Apply',
    title: 'submit online',
    text: 'Send an adoption application in minutes and follow it in real time: Submitted, Under Review, Approved, Adopted. No chasing, no guessing.',
  },
  {
    id: 'home',
    icon: HeartHandshake,
    verb: 'Welcome',
    title: 'give a rescue a home',
    text: 'Message the shelter directly, schedule a visit, and bring your new companion home. Every rescue gets a profile, a medical trail, and a real adopter.',
  },
];

const pillars = [
  {
    icon: BadgeCheck,
    tag: 'Verified',
    title: 'Verified shelters only',
    text: 'Every partner is reviewed before it can publish a listing, so you are always talking to a real organisation.',
  },
  {
    icon: ShieldCheck,
    tag: 'Transparent',
    title: 'Full medical records',
    text: 'Vaccination, deworming, spay or neuter, and microchip status sit on every profile — not buried in a phone call.',
  },
  {
    icon: FileCheck2,
    tag: 'Tracked',
    title: 'Application timeline',
    text: 'Every application carries a dated status history, so you always know exactly where your request stands.',
  },
  {
    icon: CalendarCheck,
    tag: 'Direct',
    title: 'Visit scheduling',
    text: 'Ask questions, request a meet and greet, and coordinate the visit with the shelter team in one thread.',
  },
  {
    icon: Building2,
    tag: 'Managed',
    title: 'Shelter-first tools',
    text: 'Shelters manage listings, applications, and e-waivers from a single dashboard built for rescue operations.',
  },
  {
    icon: Sparkles,
    tag: 'Free',
    title: 'Free for adopters',
    text: 'Browsing, favouriting, and applying cost nothing. Adoption fees go straight to the shelter caring for the animal.',
  },
];

const testimonials = [
  {
    quote:
      'I had been looking for weeks with no idea who I was dealing with. Paws&Homes showed me the medical history up front and let me track the application myself. Luna came home in nine days.',
    name: 'Ana Reyes',
    role: 'Adopted Luna',
  },
  {
    quote:
      'Our intake list used to live in a spreadsheet and a group chat. Now every animal has a profile, every applicant has a status, and our phone finally stopped ringing.',
    name: 'Maria Santos',
    role: 'Shelter staff, Happy Tails Rescue',
  },
  {
    quote:
      'The adoption fee and the vet records were on one page. I did not have to make a single phone call before deciding, and that is exactly what I wanted.',
    name: 'Juan Dela Cruz',
    role: 'Adopted two cats',
  },
];

export const HomePage = () => {
  const { pets, loading } = usePets();
  const { shelters } = useShelters();
  const [activeStep, setActiveStep] = useState(0);
  const visiblePets = useMemo(() => publicPets(pets), [pets]);

  const featured = useMemo(
    () => visiblePets.filter((p) => p.status === 'Available').slice(0, 6),
    [visiblePets],
  );
  const spotlight = featured[0];
  const supporting = featured.slice(1, 4);

  const adoptedCount = pets.filter((p) => p.status === 'Adopted').length;
  const stats = [
    { value: visiblePets.length || '—', label: 'pets listed' },
    { value: shelters.length || '—', label: 'partner shelters' },
    { value: adoptedCount || '—', label: 'happy adoptions' },
  ];

  return (
    <div className="landing-theme">
      {/* ---------------------------------------------------------------- HERO */}
      <section className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-background py-16 lg:py-24">
        {/* Background layer */}
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <GridOverlay />
          {/* Subtle warm glow orb */}
          <div className="absolute -right-20 top-1/4 size-[36rem] rounded-full bg-[var(--brand)]/15 blur-[120px] pointer-events-none" />
          <div className="absolute -left-20 bottom-10 size-[28rem] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        </div>

        <div className={`relative z-10 flex flex-1 flex-col justify-center ${frame}`}>
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Text, CTAs & Stats */}
            <div className="lg:col-span-6 xl:col-span-7">
              <Reveal className="mb-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/10 px-3.5 py-1.5 font-mono text-xs font-medium tracking-wide text-primary">
                  <BadgeCheck className="size-4 text-[var(--brand)]" />
                  Verified shelters and rescues
                </span>
              </Reveal>

              <Reveal delay={100}>
                <h1 className="text-left font-display text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.95] tracking-tight">
                  <span className="block text-primary">Every rescue</span>
                  <span className="block text-primary/45">deserves a home.</span>
                </h1>
              </Reveal>

              <Reveal delay={200}>
                <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  Browse adoptable pets from verified shelters, apply online, and track
                  every step — from Submitted to Adopted.
                </p>
              </Reveal>

              <Reveal delay={300} className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/pets">
                  <Button className="h-12 rounded-full px-7 text-sm font-medium shadow-md transition-all hover:shadow-lg">
                    Browse pets <ArrowRight className="size-4 ml-1" />
                  </Button>
                </Link>
                <Link to="/shelters">
                  <Button
                    variant="outline"
                    className="h-12 rounded-full border-foreground/20 px-7 text-sm font-medium hover:bg-muted"
                  >
                    Meet shelters
                  </Button>
                </Link>
              </Reveal>

              <Reveal delay={400} className="mt-12 border-t border-border/60 pt-6">
                <dl className="flex flex-wrap items-start gap-x-10 gap-y-6 lg:gap-x-14">
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
            </div>

            {/* Right Column: User's Firefly (2).png Dog Hero Image */}
            <div className="lg:col-span-6 xl:col-span-5">
              <Reveal delay={200}>
                <div className="relative mx-auto w-full max-w-[540px] lg:max-w-none">
                  {/* Background warm glowing orb */}
                  <div className="absolute left-1/2 top-1/2 -z-10 size-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-[var(--brand)]/35 via-amber-400/20 to-primary/10 blur-3xl pointer-events-none" />

                  {/* Main Hero Image Container */}
                  <div className="group relative flex flex-col items-center justify-center pt-4">
                    
                    {/* Top Floating Badge */}
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/90 px-4 py-1.5 shadow-md backdrop-blur-md">
                      <Sparkles className="size-4 text-amber-500 animate-pulse" />
                      <span className="font-mono text-xs font-semibold text-foreground">
                        Adoptable Rescues Ready For A Home
                      </span>
                    </div>

                    {/* Firefly (2).png Cutout Dog Image */}
                    <img
                      src={heroDogsGroupImg}
                      alt="Verified adoptable rescue dogs"
                      className="w-full max-h-[440px] sm:max-h-[480px] object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-[1.03]"
                    />

                    {/* Floating Pet Card / Interactive Banner */}
                    <div className="mt-4 w-full rounded-2xl border border-border/80 bg-card/95 p-4 shadow-xl backdrop-blur-md transition-all hover:border-[var(--brand)]/40">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]">
                            <ShieldCheck className="size-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground leading-tight">
                              Verified Health Records & Trails
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              100% vaccinated, spayed/neutered & shelter checked
                            </p>
                          </div>
                        </div>

                        <Link to="/pets">
                          <Button size="sm" className="rounded-full px-5 text-xs font-medium shadow-sm">
                            Meet all rescues <ChevronRight className="size-3.5 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- TRUST MARQUEE */}
      <section className="relative overflow-hidden border-y border-foreground/10 py-6">
        <div className="flex w-max animate-[landing-marquee_38s_linear_infinite] items-center gap-12">
          {[...Array(2)].flatMap((_, copy) =>
            ['Verified rescues', 'Medical records', 'Online applications', 'Direct shelter chat', 'Visit scheduling', 'Real-time tracking'].map((item) => (
              <span
                key={`${copy}-${item}`}
                className="flex shrink-0 items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
              >
                <span className="size-1 rounded-full bg-[var(--brand)]" />
                {item}
              </span>
            )),
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------- PROCESS */}
      <section id="how-it-works" className="relative overflow-hidden border-y border-border bg-muted/50 py-24 text-foreground lg:py-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 size-[400px] rounded-full bg-[var(--brand)]/[0.07] blur-[100px]"
        />
        <div className={`relative z-10 ${frame}`}>
          <div className="mb-14 grid gap-8 lg:mb-20 lg:grid-cols-12 lg:items-end">
            <Reveal className="lg:col-span-7">
              <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
                <span className="h-px w-12 bg-[var(--brand)]" />
                Process
              </span>
              <h2 className="font-display text-6xl leading-[0.88] tracking-tight md:text-7xl lg:text-[104px]">
                <span className="block text-primary">Browse.</span>
                <span className="block text-primary/55">Apply.</span>
                <span className="block text-primary/30">Welcome.</span>
              </h2>
            </Reveal>
            <Reveal delay={150} className="lg:col-span-5 lg:pb-6">
              <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Three steps from browsing to bringing a rescue home. No phone tag, no
                lost paperwork, no wondering what happens next.
              </p>
            </Reveal>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {steps.map((step, i) => {
              const isActive = i === activeStep;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(i)}
                  onMouseEnter={() => setActiveStep(i)}
                  aria-pressed={isActive}
                  className={`group relative overflow-hidden border bg-card p-8 text-left transition-all duration-500 lg:p-12 ${isActive
                      ? 'border-primary/50 shadow-sm'
                      : 'border-border hover:border-foreground/25'
                    }`}
                >
                  <div className="mb-8 flex items-center gap-4">
                    <span
                      className={`font-display text-4xl transition-colors duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground/40'
                        }`}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="h-px flex-1 overflow-hidden bg-border">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: isActive ? '100%' : '0%',
                          backgroundColor: 'var(--brand)',
                        }}
                      />
                    </div>
                    <step.icon
                      className={`size-5 shrink-0 transition-colors duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground/50'
                        }`}
                    />
                  </div>
                  <h3 className="mb-2 font-display text-3xl text-foreground lg:text-4xl">
                    {step.title}
                  </h3>
                  <span className="mb-6 block font-display text-xl text-primary/70">
                    {step.verb}
                  </span>
                  <p
                    className={`leading-relaxed text-muted-foreground transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-70'
                      }`}
                  >
                    {step.text}
                  </p>
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-1 origin-left bg-[var(--brand)] transition-transform duration-500"
                    style={{ transform: `scaleX(${isActive ? 1 : 0})` }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ FEATURED PETS */}
      <section id="pets" className="relative overflow-hidden py-24 lg:py-32">
        <div className={frame}>
          <div className="mb-16 grid gap-8 lg:mb-24 lg:grid-cols-12 lg:items-end">
            <Reveal className="lg:col-span-7">
              <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
                <span className="h-px w-12 bg-[var(--brand)]" />
                Available now
              </span>
              <h2 className="font-display text-6xl leading-[0.9] tracking-tight md:text-7xl lg:text-[112px]">
                <span className="text-primary">Ready to</span>
                <br />
                <span className="text-primary/45">meet them.</span>
              </h2>
            </Reveal>
            <Reveal delay={150} className="lg:col-span-5 lg:pb-4">
              <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
                {loading
                  ? 'Loading the latest arrivals…'
                  : `${featured.length} pets are waiting for an adopter right now.`}
              </p>
              <Link
                to="/pets"
                className="group mt-8 inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-primary transition-colors hover:text-primary/75"
              >
                View all listings
                <span className="h-px w-8 bg-current transition-all duration-300 group-hover:w-12" />
              </Link>
            </Reveal>
          </div>

          {loading ? (
            <LoadingGrid count={6} />
          ) : featured.length === 0 ? (
            <EmptyState
              title="No featured pets right now"
              description="Check back soon — new rescues arrive every week."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
              {/* Spotlight card — editorial split, image bleeding off the right edge. */}
              {spotlight && (
                <Reveal className="lg:col-span-12">
                  <article className="group relative flex min-h-[520px] overflow-hidden border border-border bg-card">
                    <div className="relative z-10 flex flex-1 flex-col justify-end p-8 lg:p-12">
                      <span className="font-mono text-sm text-muted-foreground">01</span>
                      <h3 className="mt-4 mb-6 font-display text-3xl text-foreground transition-transform duration-500 group-hover:translate-x-2 lg:text-4xl">
                        {spotlight.name}
                      </h3>
                      <p className="mb-8 max-w-md text-lg leading-relaxed text-muted-foreground">
                        {spotlight.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        <span className="font-display text-5xl text-primary lg:text-6xl">
                          {formatAge(spotlight.ageYears)}
                        </span>
                        <span className="font-mono text-sm text-muted-foreground">
                          {spotlight.breed}
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
                          <MapPin className="size-3.5" />
                          {shelters.find((s) => s.id === spotlight.shelterId)?.location ??
                            'Partner shelter'}
                        </span>
                      </div>
                      <div className="mt-10 flex flex-wrap gap-3">
                        <Link to={`/pets/${spotlight.id}`}>
                          <Button className="h-11 rounded-full px-6 text-sm">
                            Meet {spotlight.name}
                            <ArrowRight className="size-4" />
                          </Button>
                        </Link>
                        {spotlight.status !== 'Adopted' && (
                          <Link to={`/apply/${spotlight.id}`}>
                            <Button variant="outline" className="h-11 rounded-full px-6 text-sm">
                              Apply to adopt
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="relative hidden w-[42%] shrink-0 overflow-hidden lg:block">
                      <img
                        src={spotlight.imageUrl}
                        alt={spotlight.name}
                        loading="lazy"
                        className="absolute inset-0 size-full scale-105 object-cover transition-transform duration-700 group-hover:scale-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-card via-card/30 to-transparent" />
                    </div>
                  </article>
                </Reveal>
              )}

              {supporting.map((pet, i) => (
                <Reveal key={pet.id} delay={(i + 1) * 100} className="lg:col-span-4">
                  <PetCard
                    pet={pet}
                    className="h-full"
                    shelterLocation={
                      shelters.find((s) => s.id === pet.shelterId)?.location
                    }
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------ PILLARS */}
      <section id="platform" className="relative overflow-hidden py-24 lg:py-32">
        <div className={frame}>
          <Reveal className="mb-14 max-w-3xl lg:mb-20">
            <span className="mb-6 inline-flex items-center gap-4 font-mono text-sm text-muted-foreground">
              <span className="h-px w-12 bg-[var(--brand)]" />
              Why PawsConnect
            </span>
            <h2 className="font-display text-6xl leading-[0.9] tracking-tight md:text-7xl lg:text-[112px]">
              <span className="text-primary">Rescue-ready.</span>
              <br />
              <span className="text-primary/45">By default.</span>
            </h2>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {pillars.map((pillar, i) => (
              <Reveal key={pillar.title} delay={(i % 3) * 100}>
                <div className="group relative h-full overflow-hidden border border-border bg-card p-8 transition-colors duration-500 hover:border-primary/40">
                  <div className="mb-6 flex items-start justify-between">
                    <pillar.icon className="size-6 text-primary" />
                    <span className="bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {pillar.tag}
                    </span>
                  </div>
                  <h3 className="mb-3 text-lg font-medium text-foreground">{pillar.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {pillar.text}
                  </p>
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[var(--brand)] transition-transform duration-500 group-hover:scale-x-100"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ SHELTERS */}
      <section id="shelters" className="relative overflow-hidden py-24 lg:py-32">
        <div className={frame}>
          <Reveal className="mb-14 text-center lg:mb-20">
            <span className="mb-6 inline-flex items-center justify-center gap-4 font-mono text-sm text-muted-foreground">
              <span className="h-px w-12 bg-[var(--brand)]" />
              Partner shelters
              <span className="h-px w-12 bg-[var(--brand)]" />
            </span>
            <h2 className="font-display text-6xl leading-[0.9] tracking-tight md:text-7xl lg:text-[112px]">
              <span className="text-primary">Verified.</span>
              <br />
              <span className="text-primary/45">Transparent.</span>
            </h2>
            <p className="mx-auto mt-8 max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Rescues with published hours, real contact details, and listings you can
              actually trust.
            </p>
          </Reveal>

          {shelters.length === 0 ? (
            <EmptyState
              title="No partner shelters yet"
              description="We are onboarding rescues across the country."
              icon="empty"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {shelters.map((shelter, i) => (
                <Reveal key={shelter.id} delay={(i % 3) * 100}>
                  <ShelterCard shelter={shelter} />
                </Reveal>
              ))}
            </div>
          )}

          <Reveal delay={150} className="mt-12 flex justify-center">
            <Link to="/shelters">
              <Button variant="outline" className="h-12 rounded-full px-7 text-sm">
                See all shelters <ArrowRight className="size-4" />
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------------- TESTIMONIALS */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className={frame}>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-5">
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-4 -top-16 select-none font-display text-[200px] leading-none text-primary/15"
                >
                  &ldquo;
                </span>
                <h2 className="relative font-display text-5xl leading-[0.95] tracking-tight lg:text-6xl">
                  <span className="text-primary">Trusted by</span>
                  <span className="text-primary/45"> adopters and rescues.</span>
                </h2>
                <span className="relative mt-8 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
                  <span className="h-px w-12 bg-[var(--brand)]" />
                  Testimonials
                </span>
              </div>
            </Reveal>

            <Reveal delay={150} className="lg:col-span-7">
              <ul className="space-y-4">
                {testimonials.map((item) => (
                  <li
                    key={item.name}
                    className="border border-border bg-card p-8 transition-colors duration-500 hover:border-primary/35 lg:p-10"
                  >
                    <p className="text-lg leading-relaxed text-foreground/85">
                      {item.quote}
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-[var(--brand-tint)] font-mono text-sm text-primary">
                        {item.name.charAt(0)}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {item.role}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- CTA */}
      <section className="relative overflow-hidden bg-primary py-24 text-primary-foreground lg:py-32">
        <GridOverlay className="opacity-[0.10]" />
        <div className={`relative z-10 ${frame}`}>
          <Reveal className="mx-auto max-w-3xl text-center">
            <span className="mb-6 inline-flex items-center justify-center gap-4 font-mono text-sm text-primary-foreground/70">
              <span className="h-px w-12 bg-primary-foreground/40" />
              Get started
              <span className="h-px w-12 bg-primary-foreground/40" />
            </span>
            <h2 className="font-display text-6xl leading-[0.9] tracking-tight md:text-7xl lg:text-[112px]">
              Ready to bring
              <br />
              <span className="text-primary-foreground/60">one home?</span>
            </h2>
            <p className="mx-auto mt-8 max-w-lg text-lg leading-relaxed text-primary-foreground/85 sm:text-xl">
              Create an adopter account to save favourites and track applications, or
              sign in to your shelter dashboard.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link to="/signup">
                <Button className="h-12 rounded-full bg-background px-7 text-sm text-foreground hover:bg-background/90">
                  Create an account <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/pets">
                <Button
                  variant="outline"
                  className="h-12 rounded-full border-primary-foreground/40 bg-transparent px-7 text-sm text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  Browse pets
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};