import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Eye, Flag, Mail } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';

import {
  RecordCardSkeleton,
  RefreshButton,
  SectionHeader,
  TableCard,
  TablePagination,
  TableSkeletonRows,
  focusFirstError,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
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
import { VISIT_STATUS_FILTER_OPTIONS, type VisitStatusFilter } from '@/data/shelterVisits';
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

export const ShelterVisitsPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<VisitStatusFilter>('all');

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

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [...SHELTER_VISITS_QUERY_KEY, { page, pageSize, status: statusFilter }],
    queryFn: () =>
      visitService.listForShelter({ page, limit: pageSize, status: statusFilter }),
  });

  const { isRefreshing, refresh } = useRefresh(refetch);
  const showLoading = isLoading || isFetching || isRefreshing;

  const threads = data?.items ?? [];
  const total = data?.total ?? 0;

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

  const { approveMutation, declineMutation, completeMutation, isWorking } =
    useShelterVisitMutations({ onUpdated: closeDialogs });

  const openCompose = (thread: VisitThread) => {
    setComposeErrors({});
    setCompose({
      threadId: thread.id,
      // Start from the confirmed slot when rescheduling, else the request's slot.
      slot: thread.confirmedSlot ?? thread.preferredSlot ?? '',
      message: thread.shelterMessage ?? '',
    });
  };

  const openDecline = (thread: VisitThread) => {
    setDeclineErrors({});
    setDecline({ threadId: thread.id, reason: '' });
  };

  const handleSendVisitEmail = () => {
    if (!compose || !composeThread) return;

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
      slot: parsed.data.slot,
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
          description="One request per pet. Email the adopter to approve, reschedule, or decline."
          icon={CalendarClock}
          toolbar={
            <div className="flex flex-wrap items-center gap-2">
              <Select
                aria-label="Filter by status"
                className="h-9 w-[150px]"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as VisitStatusFilter);
                  setPage(1);
                }}
                options={VISIT_STATUS_FILTER_OPTIONS}
              />
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
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
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
                          </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {showLoading ? (
              <RecordCardSkeleton count={3} />
            ) : (
              threads.map((thread) => (
                <VisitMobileCard
                  key={thread.id}
                  thread={thread}
                  isWorking={isWorking}
                  onView={() => setSelectedId(thread.id)}
                  onEmail={() => openCompose(thread)}
                  onComplete={() => setCompleteId(thread.id)}
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
    </div>
  );
};
