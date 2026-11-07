import { ArrowRight, RefreshCw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState, Reveal, TablePagination } from '@/components/shared';
import { ApplicationCard } from '@/components/features/ApplicationCard';
import { EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import {
  ApplicationsCta,
  ApplicationsHero,
  ApplicationsStats,
  FRAME_CLASS,
} from '@/components/applications';
import { useMyApplicationSummary, useMyApplicationsPage, usePets } from '@/hooks/useData';
import type { ApplicationStatus } from '@/types';

/** Counters mirror the tracking stages shown on each card. */
const SUMMARY_ORDER: ApplicationStatus[] = ['Under Review', 'Approved', 'Adopted'];

export const ApplicationsPage = () => {
  // The list is paged by the backend (5 per request); the summary bar reads
  // its own endpoint so the counters stay right across every page.
  const { applications, total, pageSize, page, setPage, loading, error, refresh } =
    useMyApplicationsPage();
  const [summaryReload, setSummaryReload] = useState(0);
  const summary = useMyApplicationSummary(summaryReload);
  const { pets } = usePets();

  // O(1) pet lookup map to avoid O(N*M) scans during rendering
  const petMap = useMemo(() => new Map(pets.map((pet) => [pet.id, pet])), [pets]);

  // A withdrawal changes the list and the summary counters.
  const handleApplicationChanged = useCallback(() => {
    refresh();
    setSummaryReload((value) => value + 1);
  }, [refresh]);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setPage(nextPage);
      document
        .getElementById('application-tracker')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [setPage],
  );

  const stats = useMemo(() => {
    const summaryByStatus: Record<ApplicationStatus, number> = {
      Submitted: 0,
      'Under Review': summary?.underReview ?? 0,
      Rejected: 0,
      Cancelled: 0,
      Approved: summary?.approved ?? 0,
      Adopted: summary?.adopted ?? 0,
      Returned: 0,
    };

    return [
      { value: summary?.total || '—', label: 'applications sent' },
      ...SUMMARY_ORDER.map((status) => ({
        value: summaryByStatus[status] || '—',
        label: status.toLowerCase(),
      })),
    ];
  }, [summary]);

  return (
    <div className="landing-theme">
      <ApplicationsHero />

      <ApplicationsStats stats={stats} />

      {/* -------------------------------------------------------- TRACKER */}
      <section id="application-tracker" className="scroll-mt-24 bg-background py-20 md:py-28">
        <div className={FRAME_CLASS}>
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
              <ErrorState
                title="Could not load your applications"
                description={error}
                onRetry={refresh}
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
                    <ApplicationCard
                      key={app.id}
                      application={app}
                      pet={petMap.get(app.petId)}
                      onChanged={handleApplicationChanged}
                    />
                  ))}
                </div>

                {/* Backend-owned paging: 5 applications per request. */}
                {total > 0 && (
                  <div className="mt-10">
                    <TablePagination
                      currentPage={page}
                      totalItems={total}
                      pageSize={pageSize}
                      onPageChange={handlePageChange}
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

      <ApplicationsCta />
    </div>
  );
};
