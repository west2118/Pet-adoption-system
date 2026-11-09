import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Eye, Flag, Mail, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';

import {
  DebouncedSearchInput,
  RecordCardSkeleton,
  RefreshButton,
  SectionHeader,
  TableCard,
  TablePagination,
  TableSkeletonRows,
  focusFirstError,
} from '@/components/shared';
import { ConfirmDeleteModal } from '@/components/shared/ConfirmDeleteModal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Form';
import { VisitStatusBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { VisitCompleteModal } from '@/components/visits/VisitCompleteModal';
import { VisitDeclineSlideOver } from '@/components/visits/VisitDeclineSlideOver';
import { VisitDetailsModal } from '@/components/visits/VisitDetailsModal';
import { VisitEmailSlideOver } from '@/components/visits/VisitEmailSlideOver';
import { VisitMobileCard } from '@/components/visits/VisitMobileCard';
import {
  MAX_VISITS_PER_SHELTER,
  VISIT_STATUS_FILTER_OPTIONS,
  type VisitStatusFilter,
} from '@/data/shelterVisits';
import { useRefresh } from '@/hooks/useRefresh';
import {
  SHELTER_VISITS_QUERY_KEY,
  useShelterVisitMutations,
} from '@/hooks/useShelterVisitMutations';
import { toFieldErrors, visitDeclineSchema, visitEmailSchema } from '@/lib/validators';
import { visitService } from '@/services/visitService';
import type { VisitThread } from '@/types';
import { describeApiError } from '@/utils/errors';
import { formatDate } from '@/utils/formatters';

/** `datetime-local` value for the confirmation form (already local wall time). */
const toDatetimeLocal = (value?: string | null): string => {
  if (!value) return '';
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) ? value.slice(0, 16) : '';
};

/** Readable slot kept for the confirmation email and visit cards. */
const formatVisitSlot = (value: string): string => {
  const date = new Date(value);
  const day = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day} at ${time}`;
};

export const ShelterVisitsPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<VisitStatusFilter>('all');
  const [query, setQuery] = useState('');

  // Dialog state — compose/decline drafts keep their input values with the thread id.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compose, setCompose] = useState<{
    threadId: string;
    slot: string;
    message: string;
  } | null>(null);
  const [decline, setDecline] = useState<{ threadId: string; reason: string } | null>(null);
  const [composeErrors, setComposeErrors] = useState<
    Partial<Record<'slot' | 'message', string>>
  >({});
  const [declineErrors, setDeclineErrors] = useState<
    Partial<Record<'reason', string>>
  >({});
  const [completeId, setCompleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; label: string } | null>(
    null,
  );

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [
      ...SHELTER_VISITS_QUERY_KEY,
      { page, pageSize, status: statusFilter, search: query.trim() },
    ],
    queryFn: () =>
      visitService.listForShelter({
        page,
        limit: pageSize,
        status: statusFilter,
        search: query.trim(),
      }),
  });

  const { isRefreshing, refresh } = useRefresh(refetch);
  const showLoading = isLoading || isFetching || isRefreshing;

  const threads = data?.items ?? [];
  const total = data?.total ?? 0;
  const shelterTotal = data?.shelterTotal ?? total;

  const pageIds = threads.map((thread) => thread.id);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const describeThread = (thread: VisitThread) =>
    `Visit request for ${thread.pet?.name ?? 'pet'}${
      thread.adopter?.name ? ` from ${thread.adopter.name}` : ''
    }`;

  const describeSelectedThreads = () => {
    const selected = threads.filter((thread) => selectedIds.has(thread.id));
    const [first] = selected;
    if (selected.length === 1 && first) return describeThread(first);
    const names = [...new Set(selected.map((thread) => thread.pet?.name ?? 'pet'))];
    const shown = names.slice(0, 3).join(', ');
    const extra = names.length > 3 ? ` and ${names.length - 3} more` : '';
    return `${selected.length} visit requests for ${shown}${extra}`;
  };

  // The list row is enough to open the view; the detail query adds the email
  // history the list endpoint does not return.
  const { data: selectedDetails } = useQuery({
    queryKey: ['shelterVisit', selectedId],
    queryFn: () => visitService.getForShelter(selectedId as string),
    enabled: selectedId !== null,
  });

  const selected = selectedDetails ?? threads.find((thread) => thread.id === selectedId) ?? null;
  const composeThread = compose
    ? (threads.find((thread) => thread.id === compose.threadId) ?? null)
    : null;
  const declineThread = decline
    ? (threads.find((thread) => thread.id === decline.threadId) ?? null)
    : null;
  const completeThread = threads.find((thread) => thread.id === completeId) ?? null;

  const closeDialogs = () => {
    setCompose(null);
    setDecline(null);
    setComposeErrors({});
    setDeclineErrors({});
    setCompleteId(null);
  };

  const { approveMutation, declineMutation, completeMutation, deleteMutation, isWorking, isDeleting } =
    useShelterVisitMutations({
      onUpdated: closeDialogs,
      onDeleted: () => {
        setDeleteTarget(null);
        setSelectedIds(new Set());
      },
    });

  const openCompose = (thread: VisitThread) => {
    setComposeErrors({});
    setCompose({
      threadId: thread.id,
      // Rescheduling starts from the structured confirmed date/time.
      slot: toDatetimeLocal(thread.confirmedFor),
      message: thread.shelterMessage ?? '',
    });
  };

  const openDecline = (thread: VisitThread) => {
    setDeclineErrors({});
    setDecline({ threadId: thread.id, reason: '' });
  };

  const handleSendVisitEmail = () => {
    if (!compose || !composeThread) return;

    const scheduled = new Date(compose.slot);
    if (!compose.slot || Number.isNaN(scheduled.getTime())) {
      setComposeErrors({ slot: 'Pick the visit date and time.' });
      toast.warning('Please fix the highlighted fields.');
      focusFirstError();
      return;
    }
    if (scheduled.getTime() <= Date.now()) {
      setComposeErrors({ slot: 'Pick a date and time in the future.' });
      toast.warning('Please fix the highlighted fields.');
      focusFirstError();
      return;
    }

    const parsed = visitEmailSchema.safeParse({
      slot: compose.slot,
      message: compose.message,
    });
    if (!parsed.success) {
      setComposeErrors(toFieldErrors<'slot' | 'message'>(parsed.error.issues));
      toast.warning('Please fix the highlighted fields.');
      focusFirstError();
      return;
    }
    setComposeErrors({});

    approveMutation.mutate({
      id: composeThread.id,
      slot: formatVisitSlot(compose.slot),
      confirmedFor: compose.slot,
      message: parsed.data.message || undefined,
      isReschedule: composeThread.status === 'confirmed',
      petName: composeThread.pet?.name,
      adopterEmail: composeThread.adopter?.email,
    });
  };

  const handleDecline = () => {
    if (!decline || !declineThread) return;

    const parsed = visitDeclineSchema.safeParse({ reason: decline.reason });
    if (!parsed.success) {
      setDeclineErrors(toFieldErrors<'reason'>(parsed.error.issues));
      toast.warning('Please fix the highlighted fields.');
      focusFirstError();
      return;
    }
    setDeclineErrors({});

    declineMutation.mutate({
      id: declineThread.id,
      reason: parsed.data.reason || undefined,
      petName: declineThread.pet?.name,
    });
  };

  const handleComplete = () => {
    if (!completeThread) return;
    completeMutation.mutate({ id: completeThread.id, petName: completeThread.pet?.name });
  };

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Visit requests"
        subtitle="Approve or decline meet-and-greet requests — the adopter is emailed automatically."
        actions={<RefreshButton onRefresh={refresh} />}
      />

      <div className="mt-6">
        <TableCard
          title="Visits"
          description={
            showLoading
              ? 'One request per pet. Email the adopter to approve, reschedule, or decline.'
              : `One request per pet. Email the adopter to approve, reschedule, or decline — ${shelterTotal} of ${MAX_VISITS_PER_SHELTER} visit requests used.`
          }
          icon={CalendarClock}
          toolbar={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <DebouncedSearchInput
                aria-label="Search visits"
                value={query}
                onDebouncedChange={(value) => {
                  setQuery(value);
                  setPage(1);
                  setSelectedIds(new Set());
                }}
                placeholder="Search pet or adopter"
                className="sm:w-[240px]"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  aria-label="Filter by status"
                  className="h-9 w-[150px]"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as VisitStatusFilter);
                    setPage(1);
                    setSelectedIds(new Set());
                  }}
                  options={VISIT_STATUS_FILTER_OPTIONS}
                />
                {selectedIds.size > 0 ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-9"
                    onClick={() =>
                      setDeleteTarget({
                        ids: [...selectedIds],
                        label: describeSelectedThreads(),
                      })
                    }
                  >
                    <Trash2 className="size-4" /> Delete selected ({selectedIds.size})
                  </Button>
                ) : null}
              </div>
            </div>
          }
          error={
            error ? describeApiError(error, 'Failed to load visits. Please try again.') : null
          }
          errorTitle="Could not load visits"
          onRetry={() => void refetch()}
          isEmpty={!showLoading && !error && threads.length === 0}
          emptyTitle="No visit requests"
          emptyDescription="Adopter meet-and-greet requests will appear here."
          footer={
            total > 10 ? (
              <TablePagination
                currentPage={page}
                totalItems={total}
                pageSize={pageSize}
                onPageChange={(next) => {
                  setPage(next);
                  setSelectedIds(new Set());
                }}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                  setSelectedIds(new Set());
                }}
                label="visits"
              />
            ) : undefined
          }
          contentClassName="px-0"
        >
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all visit requests on this page"
                    />
                  </TableHead>
                  <TableHead>Pet</TableHead>
                  <TableHead>Adopter</TableHead>
                  <TableHead>Preferred slot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showLoading ? (
                  <TableSkeletonRows columns={7} rows={5} avatar />
                ) : (
                  threads.map((thread) => (
                    <TableRow key={thread.id}>
                      <TableCell className="w-10">
                        <Checkbox
                          checked={selectedIds.has(thread.id)}
                          onChange={() => toggleSelected(thread.id)}
                          aria-label={`Select visit request for ${thread.pet?.name ?? 'pet'}`}
                        />
                      </TableCell>
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
                      <TableCell className="text-muted-foreground">
                        {thread.preferredSlot}
                      </TableCell>
                      <TableCell>
                        <VisitStatusBadge status={thread.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(thread.updatedAt)}
                      </TableCell>
                      <TableCell className="text-center">                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground"
                              aria-label={`View visit request for ${thread.pet?.name ?? 'pet'}`}
                              onClick={() => setSelectedId(thread.id)}
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
                                onClick={() => setCompleteId(thread.id)}
                                disabled={isWorking}
                              >
                                <Flag className="size-4" />
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Delete visit request for ${thread.pet?.name ?? 'pet'}`}
                              title="Delete visit request"
                              onClick={() =>
                                setDeleteTarget({
                                  ids: [thread.id],
                                  label: describeThread(thread),
                                })
                              }
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
            {showLoading ? (
              <RecordCardSkeleton count={3} />
            ) : (
              threads.map((thread) => (
                <VisitMobileCard
                  key={thread.id}
                  thread={thread}
                  isWorking={isWorking}
                  selected={selectedIds.has(thread.id)}
                  onSelectChange={() => toggleSelected(thread.id)}
                  onView={() => setSelectedId(thread.id)}
                  onEmail={() => openCompose(thread)}
                  onComplete={() => setCompleteId(thread.id)}
                  onDelete={() =>
                    setDeleteTarget({
                      ids: [thread.id],
                      label: describeThread(thread),
                    })
                  }
                />
              ))
            )}
          </div>
        </TableCard>
      </div>

      <VisitDetailsModal thread={selected} onClose={() => setSelectedId(null)} />

      <VisitEmailSlideOver
        thread={composeThread}
        slot={compose?.slot ?? ''}
        message={compose?.message ?? ''}
        isSending={approveMutation.isPending}
        errors={composeErrors}
        onSlotChange={(value) => {
          setCompose((draft) => (draft ? { ...draft, slot: value } : draft));
          setComposeErrors((errors) => ({ ...errors, slot: undefined }));
        }}
        onMessageChange={(value) => {
          setCompose((draft) => (draft ? { ...draft, message: value } : draft));
          setComposeErrors((errors) => ({ ...errors, message: undefined }));
        }}
        onClose={() => setCompose(null)}
        onDecline={() => {
          if (!composeThread) return;
          setCompose(null);
          openDecline(composeThread);
        }}
        onSend={handleSendVisitEmail}
      />

      <VisitDeclineSlideOver
        thread={declineThread}
        reason={decline?.reason ?? ''}
        isWorking={declineMutation.isPending}
        errors={declineErrors}
        onReasonChange={(value) => {
          setDecline((draft) => (draft ? { ...draft, reason: value } : draft));
          setDeclineErrors((errors) => ({ ...errors, reason: undefined }));
        }}
        onClose={() => setDecline(null)}
        onConfirm={handleDecline}
      />

      <VisitCompleteModal
        thread={completeThread}
        isWorking={completeMutation.isPending}
        onClose={() => {
          if (!completeMutation.isPending) setCompleteId(null);
        }}
        onConfirm={handleComplete}
      />

      <ConfirmDeleteModal
        open={deleteTarget !== null}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate({
              ids: deleteTarget.ids,
              description: deleteTarget.label,
            });
          }
        }}
        title={
          deleteTarget && deleteTarget.ids.length === 1
            ? 'Delete visit request?'
            : `Delete ${deleteTarget?.ids.length ?? 0} visit requests?`
        }
        description="This permanently removes the selected visit requests from your records. The adopter is not notified."
        itemName={deleteTarget?.label}
        confirmLabel="Delete"
        isDeleting={isDeleting}
      />
    </div>
  );
};
