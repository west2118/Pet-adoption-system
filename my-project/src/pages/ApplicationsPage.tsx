import { ArrowRight, HeartHandshake, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BlurText, GridOverlay, Reveal, TablePagination } from '@/components/shared';
import { ApplicationCard } from '@/components/features/ApplicationCard';
import { EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import { useMyApplicationSummary, useMyApplicationsPage, usePets } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import type { ApplicationStatus } from '@/types';

const frame = 'mx-auto w-full max-w-[1400px] px-6 lg:px-12';

/** Counters mirror the tracking stages shown on each card. */
const SUMMARY_ORDER: ApplicationStatus[] = ['Under Review', 'Approved', 'Adopted'];

export const ApplicationsPage = () => {
  const { user } = useAuth();
  // The list is paged by the backend (5 per request); the summary bar reads
  // its own endpoint so the counters stay right across every page.
  const { applications, total, pageSize, page, setPage, loading, error, refresh } =
    useMyApplicationsPage(user?.id);
  const summary = useMyApplicationSummary(user?.id);
  const { pets } = usePets();

  const petById = (id: string) => pets.find((p) => p.id === id);

  const summaryByStatus: Record<ApplicationStatus, number> = {
    Submitted: 0,
    'Under Review': summary?.underReview ?? 0,
    Rejected: 0,
    Approved: summary?.approved ?? 0,
    Adopted: summary?.adopted ?? 0,
  };

  const stats = [
    { value: summary?.total || '—', label: 'applications sent' },
    ...SUMMARY_ORDER.map((status) => ({
      value: summaryByStatus[status] || '—',
      label: status.toLowerCase(),
    })),
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
              Adoption journey
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 text-center font-display text-[clamp(2.75rem,8vw,7rem)] leading-[0.9] tracking-tight">
              <span className="block text-primary">My</span>
              <span className="block">applications</span>
            </h1>
          </Reveal>

          <BlurText
            as="p"
            delay={200}
            className="mx-auto mt-10 max-w-3xl justify-center text-center text-2xl leading-relaxed text-muted-foreground md:text-3xl"
          >
            Submitted, under review, approved, adopted. Follow every application as it moves
            through the shelter.
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

      {/* -------------------------------------------------------- TRACKER */}
      <section id="application-tracker" className="scroll-mt-24 bg-background py-20 md:py-28">
        <div className={frame}>
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
                Where things stand
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Each card tracks one pet from your first application through to adoption.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
              className="rounded-full"
            >
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </Reveal>

          <div className="mt-14">
            {loading && applications.length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading applications…</p>
            ) : error ? (
              <EmptyState
                title="Could not load your applications"
                description={error}
              />
            ) : applications.length === 0 ? (
              <EmptyState
                title="No applications yet"
                description="Browse pets and submit your first adoption application."
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
              <>
                <div className="space-y-6">
                  {applications.map((app) => (
                    <ApplicationCard key={app.id} application={app} pet={petById(app.petId)} />
                  ))}
                </div>

                {/* Backend-owned paging: 5 applications per request. */}
                {total > 0 && (
                  <div className="mt-10">
                    <TablePagination
                      currentPage={page}
                      totalItems={total}
                      pageSize={pageSize}
                      onPageChange={(next) => {
                        setPage(next);
                        document
                          .getElementById('application-tracker')
                          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      showPageSize={false}
                      label="applications"
                    />
                  </div>
                )}
              </>
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
              Still looking for the right match?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
              There are more pets waiting across our partner rescues. Save favourites and
              apply whenever you are ready.
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
