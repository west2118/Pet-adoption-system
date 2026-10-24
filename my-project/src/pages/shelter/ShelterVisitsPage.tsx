import { CalendarClock, Eye, Flag, Mail, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  DetailsModal,
  RecordCard,
  RecordCardSkeleton,
  SectionHeader,
  SlideOver,
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
 * Shelter visit inbox: one request per pet from an adopter. The detail view is
 * read-only — confirming (with a visit date + message) and declining happen in
 * their own email dialogs, mirroring the inquiry inbox.
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

  // Compose dialog: visit date + message emailed to the adopter. Kept separate
  // from `selectedId` so emailing never opens the read-only details modal.
  const [composeId, setComposeId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSlot, setComposeSlot] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  // Decline / cancel dialog.
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState('');

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
    try {
      const thread = await visitService.getForShelter(id);
      setThreads((prev) => prev.map((t) => (t.id === id ? thread : t)));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load visit request.');
    }
  };

  const selected = threads.find((t) => t.id === selectedId) ?? null;
  const composeThread = threads.find((t) => t.id === composeId) ?? null;
  const declineThread = threads.find((t) => t.id === declineId) ?? null;
  const actionable = selected != null && ['requested', 'confirmed'].includes(selected.status);

  const closeDetails = () => setSelectedId(null);

  /** Opens the confirmation email for a row without opening the details view. */
  const openCompose = (thread?: VisitThread) => {
    const target = thread ?? selected;
    if (!target) return;
    setComposeId(target.id);
    // Start from the confirmed slot when rescheduling, else the request's slot.
    setComposeSlot(target.confirmedSlot ?? target.preferredSlot ?? '');
    setComposeMessage(target.shelterMessage ?? '');
    setComposeOpen(true);
  };

  const closeCompose = () => {
    if (working) return;
    setComposeOpen(false);
    setComposeId(null);
    setComposeSlot('');
    setComposeMessage('');
  };

  const openDecline = (thread?: VisitThread | null) => {
    const target = thread ?? composeThread ?? selected;
    if (!target) return;
    setDeclineId(target.id);
    setReason('');
    setDeclineOpen(true);
  };

  const closeDecline = () => {
    if (working) return;
    setDeclineOpen(false);
    setDeclineId(null);
    setReason('');
  };

  /** Emails the adopter the visit date + message and confirms the request. */
  const sendVisitEmail = async () => {
    if (!composeThread) return;
    const slot = composeSlot.trim();
    if (!slot) {
      toast.error('Add the visit date and time before sending.');
      return;
    }
    setWorking(true);
    try {
      const thread = await visitService.updateStatus(composeThread.id, {
        status: 'confirmed',
        confirmedSlot: slot,
        message: composeMessage.trim() || undefined,
      });
      setThreads((prev) => prev.map((t) => (t.id === composeThread.id ? thread : t)));
      setComposeOpen(false);
      setComposeId(null);
      setComposeSlot('');
      setComposeMessage('');
      toast.success(
        composeThread.status === 'confirmed'
          ? `Updated visit emailed to ${thread.adopter?.email ?? 'the adopter'}.`
          : `Visit approved — ${thread.pet?.name ?? 'the visit'} was emailed to the adopter.`,
      );
      await fetchThreads();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to send the visit email.');
    } finally {
      setWorking(false);
    }
  };

  /** Mark a confirmed visit completed straight from the row. */
  const completeVisit = async (thread: VisitThread) => {
    setWorking(true);
    try {
      const updated = await visitService.updateStatus(thread.id, { status: 'completed' });
      setThreads((prev) => prev.map((t) => (t.id === thread.id ? updated : t)));
      toast.success('Visit marked completed.');
      await fetchThreads();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update visit.');
    } finally {
      setWorking(false);
    }
  };

  const handleStatus = async (status: VisitStatus) => {
    if (!declineThread) return;
    setWorking(true);
    try {
      const thread = await visitService.updateStatus(declineThread.id, {
        status,
        cancelReason: status === 'cancelled' ? reason.trim() || undefined : undefined,
      });
      setThreads((prev) => prev.map((t) => (t.id === declineThread.id ? thread : t)));
      setDeclineOpen(false);
      setDeclineId(null);
      setReason('');
      toast.success(
        status === 'cancelled'
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

  /** The view modal only shows the request — decisions start from Email. */
  const detailsFooter = selected ? (
    <Button size="sm" variant="outline" className="w-full" onClick={closeDetails}>
      Close
    </Button>
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
          description="One request per pet. Email the adopter to approve, reschedule, or decline."
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
                          aria-label={`View visit request for ${thread.pet?.name ?? 'pet'}`}
                          onClick={() => void openRequest(thread.id)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        {thread.status === 'requested' || thread.status === 'confirmed' ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/40"
                            aria-label={`Email ${thread.adopter?.name ?? 'adopter'} about the visit`}
                            title="Email the adopter (date + message)"
                            onClick={() => openCompose(thread)}
                          >
                            <Mail className="size-4" />
                          </Button>
                        ) : null}
                        {thread.status === 'confirmed' ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-950/40"
                            aria-label={`Mark visit for ${thread.pet?.name ?? 'pet'} completed`}
                            title="Mark completed"
                            onClick={() => void completeVisit(thread)}
                            disabled={working}
                          >
                            <Flag className="size-4" />
                          </Button>
                        ) : null}
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
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                        aria-label={`View visit request for ${thread.pet?.name ?? 'pet'}`}
                        onClick={() => void openRequest(thread.id)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      {thread.status === 'requested' || thread.status === 'confirmed' ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/40"
                          aria-label={`Email ${thread.adopter?.name ?? 'adopter'} about the visit`}
                          onClick={() => openCompose(thread)}
                        >
                          <Mail className="size-4" />
                        </Button>
                      ) : null}
                    </>
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

      {/* Read-only request view — no inputs; decisions happen in the dialogs below. */}
      <DetailsModal
        open={selected !== null}
        onClose={closeDetails}
        title={selected?.pet?.name ? `Visit request · ${selected.pet.name}` : 'Visit request'}
        description={
          selected
            ? `Preferred ${selected.preferredSlot}${selected.confirmedSlot ? ` · confirmed ${selected.confirmedSlot}` : ''}`
            : undefined
        }
        icon={CalendarClock}
        size="xl"
        footer={detailsFooter}
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
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Last update
                </dt>
                <dd className="mt-1">{formatDate(selected.updatedAt)}</dd>
              </div>
            </dl>

            {selected.shelterMessage ? (
              <div className="rounded-lg border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Email sent to the adopter
                </p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
                  {selected.shelterMessage}
                </p>
              </div>
            ) : null}

            {selected.status === 'cancelled' && selected.cancelReason ? (
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                Note: {selected.cancelReason}
              </p>
            ) : null}

            {!actionable ? (
              <p className="text-xs text-muted-foreground">
                This visit request is closed. Its status and email history stay here for reference.
              </p>
            ) : null}
          </div>
        )}
      </DetailsModal>

      {/* Confirmation email: visit date + message, like the inquiry reply. */}
      <SlideOver
        open={composeOpen}
        onClose={closeCompose}
        title={
          composeThread ? `Email ${composeThread.adopter?.name ?? 'the adopter'}` : 'Email adopter'
        }
        description={
          composeThread
            ? `${composeThread.pet?.name ?? 'Visit'} · ${composeThread.adopter?.email ?? 'no email on file'}`
            : undefined
        }
        icon={Mail}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="mr-auto text-destructive"
              onClick={() => {
                setComposeOpen(false);
                openDecline(composeThread);
              }}
              disabled={working}
            >
              <X className="size-3.5" />{' '}
              {composeThread?.status === 'confirmed' ? 'Cancel visit' : 'Decline instead'}
            </Button>
            <Button variant="outline" size="sm" onClick={closeCompose} disabled={working}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => void sendVisitEmail()}
              disabled={working || !composeSlot.trim()}
            >
              {working
                ? 'Sending…'
                : composeThread?.status === 'confirmed'
                  ? 'Send update'
                  : 'Send & approve'}
            </Button>
          </div>
        }
      >
        {composeThread && (
          <div className="space-y-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">To</p>
              <p className="mt-1 text-sm font-medium">{composeThread.adopter?.name ?? 'Adopter'}</p>
              <p className="text-sm text-muted-foreground">
                {composeThread.adopter?.email ?? 'No email on file'}
              </p>
            </div>

            <div className="rounded-lg bg-muted/60 px-3 py-2">
              <p className="text-xs font-semibold">Their request</p>
              <p className="mt-0.5 text-sm">
                {composeThread.pet?.name ?? 'Pet'} · preferred {composeThread.preferredSlot}
              </p>
            </div>

            <div>
              <Label htmlFor="visit-email-slot">Visit date &amp; time</Label>
              <Input
                id="visit-email-slot"
                value={composeSlot}
                onChange={(e) => setComposeSlot(e.target.value)}
                placeholder="e.g. Sat, Oct 18 at 10:00 AM"
                maxLength={255}
              />
            </div>

            <div>
              <Label htmlFor="visit-email-message">Message</Label>
              <Textarea
                id="visit-email-message"
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                placeholder={`Where to meet and anything ${composeThread.adopter?.name ?? 'they'} should bring…`}
                className="min-h-40"
                maxLength={1000}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Sending emails the adopter this date and message and{' '}
              {composeThread.status === 'confirmed'
                ? 'updates the confirmed schedule.'
                : 'approves the visit request.'}
            </p>
          </div>
        )}
      </SlideOver>

      {/* Decline / cancel visit with a reason emailed to the adopter. */}
      <SlideOver
        open={declineOpen}
        onClose={closeDecline}
        title={
          declineThread?.status === 'confirmed' ? 'Cancel this visit?' : 'Decline this visit?'
        }
        description={
          declineThread
            ? `${declineThread.pet?.name ?? 'Visit'} · ${declineThread.adopter?.email ?? 'adopter'}`
            : undefined
        }
        icon={X}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={closeDecline} disabled={working}>
              Keep request
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void handleStatus('cancelled')}
              disabled={working}
            >
              {working
                ? 'Working…'
                : declineThread?.status === 'confirmed'
                  ? 'Cancel visit'
                  : 'Decline request'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The adopter is emailed this decision. Their request keeps the cancelled status here.
          </p>
          <div>
            <Label htmlFor="visit-cancel-reason">Reason emailed to the adopter (optional)</Label>
            <Textarea
              id="visit-cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Let the adopter know why…"
              maxLength={500}
            />
          </div>
        </div>
      </SlideOver>
    </div>
  );
};
