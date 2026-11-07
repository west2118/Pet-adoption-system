import { ArrowRight, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState, Reveal, TablePagination } from '@/components/shared';
import { VisitCard } from '@/components/features/VisitCard';
import { EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import {
  FRAME_CLASS,
  VisitsCta,
  VisitsHero,
  VisitsStats,
} from '@/components/visits';
import { ApiError } from '@/lib/apiClient';
import { getMyVisitSummary, listMyVisits } from '@/services/visitService';
import type { VisitSummary } from '@/services/visitService';
import type { VisitThread } from '@/types';

/** Counters mirror the progress stages shown on each card. */
const SUMMARY_ORDER = [
  { key: 'requested', label: 'requested' },
  { key: 'confirmed', label: 'confirmed' },
  { key: 'completed', label: 'completed' },
] as const;

export const VisitsPage = () => {
  // The list is paged by the backend; the summary band reads its own
  // endpoint so the counters stay right across every page.
  const [threads, setThreads] = useState<VisitThread[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<VisitSummary | null>(null);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, stats] = await Promise.all([
        listMyVisits({ page, limit: pageSize }),
        getMyVisitSummary(),
      ]);
      setThreads(list.items);
      setTotal(list.total);
      setPageSize(list.limit);
      setSummary(stats);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load your visits.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    // Loading state is owned by the fetch callback.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchThreads();
  }, [fetchThreads]);

  const refresh = useCallback(() => {
    void fetchThreads();
  }, [fetchThreads]);

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
    document
      .getElementById('visit-tracker')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const stats = useMemo(
    () => [
      { value: summary?.total || '—', label: 'visits requested' },
      ...SUMMARY_ORDER.map(({ key, label }) => ({
        value: summary?.[key] || '—',
        label,
      })),
    ],
    [summary],
  );

  return (
    <div className="landing-theme">
      <VisitsHero />

      <VisitsStats stats={stats} />

      {/* -------------------------------------------------------- TRACKER */}
      <section id="visit-tracker" className="scroll-mt-24 bg-background py-20 md:py-28">
        <div className={FRAME_CLASS}>
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
                Where things stand
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Each card tracks one pet from your visit request through to the
                meet-and-greet.
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
            {loading && threads.length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading visits…</p>
            ) : error ? (
              <ErrorState title="Could not load your visits" description={error} />
            ) : threads.length === 0 ? (
              <EmptyState
                title="No visits yet"
                description="Browse pets and request your first meet-and-greet."
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
                  {threads.map((thread) => (
                    <VisitCard key={thread.id} thread={thread} onChanged={refresh} />
                  ))}
                </div>

                {/* Backend-owned paging. */}
                {total > 0 && (
                  <div className="mt-10">
                    <TablePagination
                      currentPage={page}
                      totalItems={total}
                      pageSize={pageSize}
                      onPageChange={handlePageChange}
                      showPageSize={false}
                      label="visits"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <VisitsCta />
    </div>
  );
};
