import { CalendarClock, Check, Eye, Flag, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  DetailsModal,
  RecordCard,
  RecordCardSkeleton,
  SectionHeader,
  TableCard,
  TablePagination,
  TableSkeletonRows,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/Form';
import { VisitStatusBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { ApiError } from '@/lib/apiClient';
import { visitService } from '@/services/visitService';
import type { VisitStatus, VisitThread } from '@/types';
import { formatDate } from '@/utils/formatters';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'requested', label: 'Requested' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

/**
 * Shelter visit inbox: one request per pet from an adopter. Staff approve
 * (confirm) or decline (cancel) each request; the adopter is emailed the
 * decision automatically. There is no conversation to maintain.
 */
export const ShelterVisitsPage = () => {
  const [threads, setThreads] = useState<VisitThread[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [slot, setSlot] = useState('');
  const [reason, setReason] = useState('');
  const [showDecline, setShowDecline] = useState(false);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await visitService.listForShelter({ page, limit: pageSize, status: statusFilter });
      setThreads(res.items);
      setTotal(res.total);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load visits.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const openRequest = async (id: string) => {
    setSelectedId(id);
    setShowDecline(false);
    setReason('');
    try {
      const thread = await visitService.getForShelter(id);
      setThreads((prev) => prev.map((t) => (t.id === id ? thread : t)));
      setSlot(thread.confirmedSlot ?? thread.preferredSlot ?? '');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load visit request.');
    }
  };

  const selected = threads.find((t) => t.id === selectedId) ?? null;
  const actionable = selected != null && ['requested', 'confirmed'].includes(selected.status);

  const handleStatus = async (status: VisitStatus) => {
    if (!selectedId) return;
    setWorking(true);
    try {
      const thread = await visitService.updateStatus(selectedId, {
        status,
        confirmedSlot: status === 'confirmed' ? slot.trim() || undefined : undefined,
        cancelReason: status === 'cancelled' ? reason.trim() || undefined : undefined,
      });
      setThreads((prev) => prev.map((t) => (t.id === selectedId ? thread : t)));
      setShowDecline(false);
      setReason('');
      toast.success(
        status === 'confirmed'
          ? `${thread.pet?.name ?? 'Visit'} approved — the adopter has been emailed.`
          : status === 'cancelled'
            ? `${thread.pet?.name ?? 'Visit'} declined — the adopter has been emailed.`
            : 'Visit marked completed.',
      );
      await fetchThreads();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update visit.');
    } finally {
      setWorking(false);
    }
  };

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        aria-label="Filter by status"
        className="h-9 w-[150px]"
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value);
          setPage(1);
        }}
        options={STATUS_FILTER_OPTIONS}
      />
    </div>
  );

  const pagination =
    total > 0 ? (
      <TablePagination
        currentPage={page}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        label="visits"
      />
    ) : undefined;

  const actionBar =
    selected && actionable ? (
      <div className="space-y-2 rounded-lg border p-3">
        {selected.status === 'requested' && (
          <div>
            <Label htmlFor="visit-slot">Visit date/time (defaults to their preferred slot)</Label>
            <Input
              id="visit-slot"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              placeholder="e.g. Sat, Oct 18 at 10:00 AM"
            />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {selected.status === 'requested' && (
            <>
              <Button size="sm" onClick={() => void handleStatus('confirmed')} disabled={working}>
                <Check className="size-3.5" /> Approve request
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                onClick={() => setShowDecline((v) => !v)}
                disabled={working}
              >
                <X className="size-3.5" /> Decline
              </Button>
            </>
          )}
          {selected.status === 'confirmed' && (
            <>
              <Button size="sm" onClick={() => void handleStatus('completed')} disabled={working}>
                <Flag className="size-3.5" /> Mark completed
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                onClick={() => setShowDecline((v) => !v)}
                disabled={working}
              >
                <X className="size-3.5" /> Cancel visit
              </Button>
            </>
          )}
        </div>
        {showDecline && (
          <div className="space-y-2">
            <Label htmlFor="visit-cancel-reason">Reason emailed to the adopter (optional)</Label>
            <Textarea
              id="visit-cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Let the adopter know why…"
            />
            <Button
              size="sm"
              variant="destructive"
              onClick={() => void handleStatus('cancelled')}
              disabled={working}
            >
              {working ? 'Working…' : selected.status === 'requested' ? 'Confirm decline' : 'Confirm cancellation'}
            </Button>
          </div>
        )}
      </div>
    ) : undefined;

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Visit requests"
        subtitle="Approve or decline meet-and-greet requests — the adopter is emailed automatically."
      />

      <div className="mt-6">
        <TableCard
          title="Visits"
          description="One request per pet. Approve and decline from the request details."
          icon={CalendarClock}
          toolbar={toolbar}
          isEmpty={!loading && threads.length === 0}
          emptyTitle="No visit requests"
          emptyDescription="Adopter meet-and-greet requests will appear here."
          footer={pagination}
          contentClassName="px-0"
        >
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pet</TableHead>
                  <TableHead>Adopter</TableHead>
                  <TableHead>Preferred slot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeletonRows columns={6} rows={5} avatar />
                ) : (
                  threads.map((thread) => (
                    <TableRow key={thread.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {thread.pet?.imageUrl ? (
                            <img
                              src={thread.pet.imageUrl}
                              alt={thread.pet.name}
                              className="size-10 shrink-0 rounded-lg object-cover"
                            />
                          ) : null}
                          <p className="font-medium">{thread.pet?.name ?? '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {thread.adopter?.name ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{thread.preferredSlot}</TableCell>
                      <TableCell>
                        <VisitStatusBadge status={thread.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(thread.updatedAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground"
                          aria-label={`Open visit request for ${thread.pet?.name ?? 'pet'}`}
                          onClick={() => void openRequest(thread.id)}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {loading ? (
              <RecordCardSkeleton count={3} />
            ) : (
              threads.map((thread) => (
                <RecordCard
                  key={thread.id}
                  imageUrl={thread.pet?.imageUrl}
                  imageAlt={thread.pet?.name}
                  title={thread.pet?.name ?? 'Visit'}
                  subtitle={`${thread.adopter?.name ?? 'Adopter'} · ${thread.preferredSlot}`}
                  badges={<VisitStatusBadge status={thread.status} />}
                  actions={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                      aria-label={`Open visit request for ${thread.pet?.name ?? 'pet'}`}
                      onClick={() => void openRequest(thread.id)}
                    >
                      <Eye className="size-4" />
                    </Button>
                  }
                >
                  <p className="text-sm text-muted-foreground">
                    Updated {formatDate(thread.updatedAt)}
                  </p>
                </RecordCard>
              ))
            )}
          </div>
        </TableCard>
      </div>

      <DetailsModal
        open={selected !== null}
        onClose={() => setSelectedId(null)}
        title={selected?.pet?.name ? `Visit request · ${selected.pet.name}` : 'Visit request'}
        description={
          selected
            ? `Preferred ${selected.preferredSlot}${selected.confirmedSlot ? ` · confirmed ${selected.confirmedSlot}` : ''}`
            : undefined
        }
        icon={CalendarClock}
        size="xl"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <VisitStatusBadge status={selected.status} />
              <span className="text-sm text-muted-foreground">
                Requested {formatDate(selected.createdAt)}
              </span>
            </div>

            <dl className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Adopter
                </dt>
                <dd className="mt-1">{selected.adopter?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Email
                </dt>
                <dd className="mt-1 break-all">{selected.adopter?.email ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Preferred slot
                </dt>
                <dd className="mt-1">{selected.preferredSlot}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Confirmed slot
                </dt>
                <dd className="mt-1">{selected.confirmedSlot ?? 'Not confirmed yet'}</dd>
              </div>
            </dl>

            {selected.status === 'cancelled' && selected.cancelReason ? (
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                Note: {selected.cancelReason}
              </p>
            ) : null}

            {actionBar}

            <p className="text-xs text-muted-foreground">
              Approving or declining emails the adopter automatically. Their request keeps its
              status here so you can track it.
            </p>
          </div>
        )}
      </DetailsModal>
    </div>
  );
};
