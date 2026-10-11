import { CalendarClock, Check, Eye, Flag, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { VisitThreadView } from '@/components/features/VisitThreadView';
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
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/apiClient';
import { visitService } from '@/services/visitService';
import type { VisitMessage, VisitStatus, VisitThread } from '@/types';
import { formatDate } from '@/utils/formatters';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'requested', label: 'Requested' },
  { value: 'proposed', label: 'Proposed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

/**
 * Shelter visit inbox: adopter meet-and-greet threads for this shelter's
 * pets — propose/confirm slots, message back, and close out visits.
 */
export const ShelterVisitsPage = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<VisitThread[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<VisitMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [working, setWorking] = useState(false);
  const [slot, setSlot] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);

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

  const openThread = async (id: string) => {
    setSelectedId(id);
    setMessages([]);
    setShowCancel(false);
    setLoadingMessages(true);
    try {
      const { thread, messages: fetched } = await visitService.getForShelter(id);
      setThreads((prev) => prev.map((t) => (t.id === id ? thread : t)));
      setSlot(thread.confirmedSlot ?? '');
      setMessages(fetched);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load conversation.');
    } finally {
      setLoadingMessages(false);
    }
  };

  const selected = threads.find((t) => t.id === selectedId) ?? null;
  const actionable = selected != null && ['requested', 'proposed', 'confirmed'].includes(selected.status);

  const refreshSelected = async (id: string) => {
    try {
      const { thread, messages: fetched } = await visitService.getForShelter(id);
      setThreads((prev) => prev.map((t) => (t.id === id ? thread : t)));
      setSlot(thread.confirmedSlot ?? '');
      setMessages(fetched);
    } catch {
      await fetchThreads();
    }
  };

  const handleSend = async (body: string) => {
    if (!selectedId) return;
    setSending(true);
    try {
      const message = await visitService.postShelterMessage(selectedId, body);
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleStatus = async (status: VisitStatus) => {
    if (!selectedId) return;
    if ((status === 'proposed' || status === 'confirmed') && !slot.trim() && !selected?.confirmedSlot) {
      toast.warning('Enter the visit date/time first.');
      return;
    }
    setWorking(true);
    try {
      await visitService.updateStatus(selectedId, {
        status,
        confirmedSlot: slot.trim() || undefined,
        cancelReason: status === 'cancelled' ? cancelReason.trim() || undefined : undefined,
      });
      toast.success(`Visit ${status}.`);
      setShowCancel(false);
      setCancelReason('');
      await fetchThreads();
      await refreshSelected(selectedId);
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

  const actionBar = selected && actionable ? (
    <div className="space-y-2 rounded-lg border p-3">
      {(selected.status === 'requested' || selected.status === 'proposed') && (
        <div>
          <Label htmlFor="visit-slot">Visit date/time</Label>
          <Input
            id="visit-slot"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            placeholder="e.g. Sat, Oct 18 at 10:00 AM"
          />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {(selected.status === 'requested' || selected.status === 'proposed') && (
          <>
            <Button size="sm" onClick={() => void handleStatus('proposed')} disabled={working}>
              Propose time
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleStatus('confirmed')}
              disabled={working}
            >
              <Check className="size-3.5" /> Confirm
            </Button>
          </>
        )}
        {selected.status === 'confirmed' && (
          <Button size="sm" onClick={() => void handleStatus('completed')} disabled={working}>
            <Flag className="size-3.5" /> Mark completed
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive"
          onClick={() => setShowCancel((v) => !v)}
          disabled={working}
        >
          <X className="size-3.5" /> Cancel
        </Button>
      </div>
      {showCancel && (
        <div className="space-y-2">
          <Label htmlFor="visit-cancel-reason">Cancellation note (optional)</Label>
          <Textarea
            id="visit-cancel-reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason shared with the adopter…"
          />
          <Button
            size="sm"
            variant="destructive"
            onClick={() => void handleStatus('cancelled')}
            disabled={working}
          >
            {working ? 'Working…' : 'Confirm cancellation'}
          </Button>
        </div>
      )}
    </div>
  ) : undefined;

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Visit requests"
        subtitle="Meet-and-greet threads for your shelter's pets."
      />

      <div className="mt-6">
        <TableCard
          title="Visits"
          description="Coordinate times and answer questions in one thread per pet."
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
                  <TableHead>Preferred slot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeletonRows columns={5} rows={5} avatar />
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
                          aria-label={`Open visit thread for ${thread.pet?.name ?? 'pet'}`}
                          onClick={() => void openThread(thread.id)}
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
                  subtitle={thread.preferredSlot}
                  badges={<VisitStatusBadge status={thread.status} />}
                  actions={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                      aria-label={`Open visit thread for ${thread.pet?.name ?? 'pet'}`}
                      onClick={() => void openThread(thread.id)}
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
        title={selected?.pet?.name ? `Visit · ${selected.pet.name}` : 'Visit thread'}
        description={
          selected
            ? `Preferred ${selected.preferredSlot}${selected.confirmedSlot ? ` · confirmed ${selected.confirmedSlot}` : ''}`
            : undefined
        }
        icon={CalendarClock}
        size="xl"
      >
        {selected && (
          <VisitThreadView
            thread={selected}
            messages={messages}
            currentUserId={user?.id}
            loadingMessages={loadingMessages}
            sending={sending || working}
            onSend={handleSend}
            actionBar={actionBar}
          />
        )}
      </DetailsModal>
    </div>
  );
};
