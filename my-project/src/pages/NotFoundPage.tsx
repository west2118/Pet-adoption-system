import { ArrowLeft, ArrowRight, ArrowUpRight, Compass, PawPrint } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GridOverlay, Reveal } from '@/components/shared';
import { Button } from '@/components/ui/button';
import heroDogsGroupImg from '@/assets/landing-page/Firefly (2).png';

const frame = 'mx-auto w-full max-w-[1400px] px-6 lg:px-12';

const suggestions = [
  { to: '/shelters', label: 'Meet the shelters' },
  { to: '/favorites', label: 'View saved pets' },
  { to: '/applications', label: 'Track an application' },
];

export const NotFoundPage = () => {
  return (
    <div className="landing-theme">
      <section className="relative flex min-h-[calc(100svh-5rem)] items-center overflow-hidden bg-background py-16 sm:py-20 lg:py-24">
        {/* Warm editorial backdrop — mirrors the landing and auth pages. */}
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <GridOverlay />
          <div className="absolute -right-20 top-1/4 size-[36rem] rounded-full bg-[var(--brand)]/15 blur-[120px] pointer-events-none" />
          <div className="absolute -left-20 bottom-10 size-[28rem] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        </div>

        <div className={`relative z-10 ${frame}`}>
          <div className="grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-16">
            {/* --------------------------------------------------------- COPY */}
            <div className="lg:col-span-6">
              <Reveal>
                <span className="inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  <span className="h-px w-12 bg-[var(--brand)]" />
                  Error 404 · Page not found
                </span>
              </Reveal>

              <Reveal delay={80}>
                <h1 className="mt-6 font-display text-[clamp(3rem,7.5vw,6.5rem)] leading-[0.9] tracking-tight">
                  <span className="block text-primary">This page</span>
                  <span className="block text-primary/45">wandered off.</span>
                </h1>
              </Reveal>

              <Reveal delay={160}>
                <p className="mt-8 max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  The link may be broken, or the page may have moved somewhere new. Either
                  way, there are still plenty of rescues waiting to meet you.
                </p>
              </Reveal>

              <Reveal delay={240} className="mt-9 flex flex-wrap items-center gap-3">
                <Link to="/">
                  <Button className="h-12 rounded-full px-7 text-sm font-medium shadow-md transition-all hover:shadow-lg">
                    <ArrowLeft className="size-4" />
                    Back to home
                  </Button>
                </Link>
                <Link to="/pets">
                  <Button
                    variant="outline"
                    className="h-12 rounded-full border-foreground/20 px-7 text-sm font-medium hover:bg-muted"
                  >
                    Browse pets
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </Reveal>

              <Reveal delay={320} className="mt-10 border-t border-border/60 pt-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Maybe you were looking for
                </p>
                <nav
                  aria-label="Suggested pages"
                  className="mt-4 flex flex-wrap gap-x-8 gap-y-3"
                >
                  {suggestions.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="group inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
                    >
                      {link.label}
                      <ArrowUpRight className="size-3.5 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  ))}
                </nav>
              </Reveal>
            </div>

            {/* ------------------------------------------------------- VISUAL */}
            <div className="lg:col-span-6">
              <Reveal delay={200}>
                <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-[var(--brand)]/30 via-amber-400/20 to-primary/10 blur-3xl"
                  />

                  <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-to-br from-[var(--brand-tint)] via-orange-50 to-amber-50 shadow-xl">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-2 -top-10 select-none font-display text-[11rem] leading-none text-primary/[0.08] sm:-top-14 sm:text-[15rem]"
                    >
                      404
                    </span>

                    <div className="relative flex flex-col px-6 pb-6 pt-8 sm:px-10 sm:pb-8 sm:pt-9">
                      <div className="flex justify-center">
                        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/90 px-4 py-1.5 shadow-sm backdrop-blur-md">
                          <Compass className="size-3.5 text-[var(--brand)]" />
                          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
                            Wrong turn
                          </span>
                        </span>
                      </div>

                      <img
                        src={heroDogsGroupImg}
                        alt="A group of adoptable rescue dogs"
                        className="mx-auto -mt-1 w-full max-w-[470px] object-contain drop-shadow-2xl"
                      />

                      <div className="mt-2 rounded-2xl border border-border/70 bg-card/95 p-4 shadow-lg backdrop-blur-md sm:p-5">
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                          <div className="flex items-center gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]">
                              <PawPrint className="size-5" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold leading-tight text-foreground">
                                The page is missing. The pets aren&apos;t.
                              </p>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                Rescues from verified shelters are still waiting to meet
                                you.
                              </p>
                            </div>
                          </div>

                          <Link to="/pets" className="shrink-0">
                            <Button
                              size="sm"
                              className="rounded-full px-5 text-xs font-medium shadow-sm"
                            >
                              Browse pets
                              <ArrowRight className="size-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
