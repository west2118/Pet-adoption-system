import { useQuery } from '@tanstack/react-query';
import { Eye, Mail, MessageCircleQuestion, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import {
  InquiryDetailsModal,
  InquiryEmailSlideOver,
  InquiryMobileCard,
  InquiryStatusBadge,
  type EmailDraft,
} from '@/components/inquiries';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  INQUIRY_STATUS_FILTER_OPTIONS,
  MAX_INQUIRIES_PER_SHELTER,
  type InquiryStatusFilter,
} from '@/data/shelterInquiries';
import { usePets } from '@/hooks/useData';
import { useRefresh } from '@/hooks/useRefresh';
import {
  SHELTER_INQUIRIES_QUERY_KEY,
  useShelterInquiryMutations,
} from '@/hooks/useShelterInquiryMutations';
import { inquiryReplySchema, toFieldErrors } from '@/lib/validators';
import { listShelterInquiriesPaginated } from '@/services/api';
import type { Inquiry } from '@/services/api';
import { describeApiError } from '@/utils/errors';
import { formatDate } from '@/utils/formatters';

export const ShelterInquiriesPage = () => {
  const { pets } = usePets();

  // Filters and pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InquiryStatusFilter>('all');

  // Dialog state
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [emailErrors, setEmailErrors] = useState<
    Partial<Record<'subject' | 'message', string>>
  >({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; label: string } | null>(
    null,
  );

  const petById = useMemo(() => new Map(pets.map((pet) => [pet.id, pet])), [pets]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [
      ...SHELTER_INQUIRIES_QUERY_KEY,
      { page, pageSize, search: query.trim(), statusFilter },
    ],
    queryFn: () =>
      listShelterInquiriesPaginated({
        page,
        limit: pageSize,
        resolved: statusFilter === 'all' ? undefined : statusFilter === 'resolved',
        search: query.trim(),
      }),
  });

  const { isRefreshing, refresh } = useRefresh(refetch);
  const showLoading = isLoading || isFetching || isRefreshing;

  const inquiries = data?.items ?? [];
  const totalInquiries = data?.total ?? 0;
  const shelterTotal = data?.shelterTotal ?? totalInquiries;

  const pageIds = inquiries.map((inquiry) => inquiry.id);
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

  const describeInquiry = (inquiry: Inquiry) => {
    const pet = petById.get(inquiry.petId);
    return `Inquiry from ${inquiry.fromName}${pet ? ` about ${pet.name}` : ''}`;
  };

  const describeSelectedInquiries = () => {
    const selected = inquiries.filter((inquiry) => selectedIds.has(inquiry.id));
    const [first] = selected;
    if (selected.length === 1 && first) return describeInquiry(first);
    const names = [...new Set(selected.map((inquiry) => inquiry.fromName))];
    const shown = names.slice(0, 3).join(', ');
    const extra = names.length > 3 ? ` and ${names.length - 3} more` : '';
    return `${selected.length} inquiries from ${shown}${extra}`;
  };

  const { emailMutation, deleteMutation, isSending, isDeleting } =
    useShelterInquiryMutations({
      onEmailed: () => setEmailDraft(null),
      onConflict: () => setEmailDraft(null),
      onDeleted: () => {
        setDeleteTarget(null);
        setSelectedIds(new Set());
      },
    });

  const detailsInquiry = inquiries.find((inquiry) => inquiry.id === detailsId) ?? null;

  const openEmailCompose = (inquiry: Inquiry) => {
    const pet = petById.get(inquiry.petId);
    setEmailErrors({});
    setEmailDraft({
      inquiry,
      subject: pet ? `Your inquiry about ${pet.name}` : 'Your inquiry',
      message: '',
    });
  };

  const closeEmailCompose = () => {
    if (isSending) return;
    setEmailErrors({});
    setEmailDraft(null);
  };

  const handleSendEmail = () => {
    if (!emailDraft) return;

    const parsed = inquiryReplySchema.safeParse({
      subject: emailDraft.subject,
      message: emailDraft.message,
    });
    if (!parsed.success) {
      setEmailErrors(toFieldErrors<'subject' | 'message'>(parsed.error.issues));
      toast.warning('Please fix the highlighted fields.');
      focusFirstError();
      return;
    }
    setEmailErrors({});

    emailMutation.mutate({
      id: emailDraft.inquiry.id,
      fromEmail: emailDraft.inquiry.fromEmail,
      subject: parsed.data.subject,
      message: parsed.data.message,
    });
  };

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Inquiries inbox"
        subtitle="Messages from potential adopters about your pets."
        actions={<RefreshButton onRefresh={refresh} />}
      />

      <div className="mt-6 space-y-4">
        <TableCard
          title="Inquiries"
          description={
            showLoading
              ? 'Direct messages from adopters about your listings.'
              : `Direct messages from adopters about your listings — ${shelterTotal} of ${MAX_INQUIRIES_PER_SHELTER} inquiries used.`
          }
          icon={MessageCircleQuestion}
          toolbar={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <DebouncedSearchInput
                aria-label="Search inquiries"
                value={query}
                onDebouncedChange={(value) => {
                  setQuery(value);
                  setPage(1);
                  setSelectedIds(new Set());
                }}
                placeholder="Search sender or pet"
                className="sm:w-[240px]"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  aria-label="Filter by status"
                  className="h-9 w-[150px]"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as InquiryStatusFilter);
                    setPage(1);
                    setSelectedIds(new Set());
                  }}
                  options={INQUIRY_STATUS_FILTER_OPTIONS}
                />
                {selectedIds.size > 0 ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-9"
                    onClick={() =>
                      setDeleteTarget({
                        ids: [...selectedIds],
                        label: describeSelectedInquiries(),
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
            error
              ? describeApiError(error, 'Failed to load inquiries. Please try again.')
              : null
          }
          errorTitle="Could not load inquiries"
          onRetry={() => void refetch()}
          isEmpty={!showLoading && !error && inquiries.length === 0}
          emptyTitle="No inquiries found"
          emptyDescription="Try a different search or filter."
          footer={
            totalInquiries > 10 ? (
              <TablePagination
                currentPage={page}
                totalItems={totalInquiries}
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
                label="inquiries"
              />
            ) : undefined
          }
          contentClassName="px-0"
        >
          {/* Desktop: data table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all inquiries on this page"
                    />
                  </TableHead>
                  <TableHead>Pet</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showLoading ? (
                  <TableSkeletonRows columns={7} rows={5} avatar />
                ) : (
                  inquiries.map((inquiry) => {
                    const pet = petById.get(inquiry.petId);
                    return (
                      <TableRow key={inquiry.id}>
                        <TableCell className="w-10">
                          <Checkbox
                            checked={selectedIds.has(inquiry.id)}
                            onChange={() => toggleSelected(inquiry.id)}
                            aria-label={`Select inquiry from ${inquiry.fromName}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {pet ? (
                              <img
                                src={pet.imageUrl}
                                alt={pet.name}
                                className="size-10 shrink-0 rounded-lg object-cover"
                              />
                            ) : null}
                            <div className="min-w-0">
                              <p className="font-medium">{pet?.name ?? '—'}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {pet?.breed ?? 'Unknown breed'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="font-medium">{inquiry.fromName}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {inquiry.fromEmail}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[280px]">
                          <p className="truncate text-muted-foreground">{inquiry.message}</p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(inquiry.createdAt)}
                        </TableCell>
                        <TableCell>
                          <InquiryStatusBadge resolved={inquiry.resolved} />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground"
                              aria-label={`View inquiry from ${inquiry.fromName}`}
                              onClick={() => setDetailsId(inquiry.id)}
                            >
                              <Eye className="size-4" />
                            </Button>
                            {inquiry.emailedAt ? null : (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/40"
                                aria-label={`Email ${inquiry.fromName}`}
                                onClick={() => openEmailCompose(inquiry)}
                              >
                                <Mail className="size-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Delete inquiry from ${inquiry.fromName}`}
                              title="Delete inquiry"
                              onClick={() =>
                                setDeleteTarget({
                                  ids: [inquiry.id],
                                  label: describeInquiry(inquiry),
                                })
                              }
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: stacked cards */}
          <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
            {showLoading ? (
              <RecordCardSkeleton count={3} />
            ) : (
              inquiries.map((inquiry) => (
                <InquiryMobileCard
                  key={inquiry.id}
                  inquiry={inquiry}
                  pet={petById.get(inquiry.petId)}
                  selected={selectedIds.has(inquiry.id)}
                  onSelectChange={() => toggleSelected(inquiry.id)}
                  onView={() => setDetailsId(inquiry.id)}
                  onEmail={() => openEmailCompose(inquiry)}
                  onDelete={() =>
                    setDeleteTarget({
                      ids: [inquiry.id],
                      label: describeInquiry(inquiry),
                    })
                  }
                />
              ))
            )}
          </div>
        </TableCard>
      </div>

      <InquiryDetailsModal
        inquiry={detailsInquiry}
        pet={detailsInquiry ? petById.get(detailsInquiry.petId) : undefined}
        onClose={() => setDetailsId(null)}
      />

      <InquiryEmailSlideOver
        draft={emailDraft}
        petName={emailDraft ? petById.get(emailDraft.inquiry.petId)?.name : undefined}
        isSending={isSending}
        errors={emailErrors}
        onSubjectChange={(subject) => {
          setEmailDraft((draft) => (draft ? { ...draft, subject } : draft));
          setEmailErrors((errors) => ({ ...errors, subject: undefined }));
        }}
        onMessageChange={(message) => {
          setEmailDraft((draft) => (draft ? { ...draft, message } : draft));
          setEmailErrors((errors) => ({ ...errors, message: undefined }));
        }}
        onClose={closeEmailCompose}
        onSend={handleSendEmail}
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
            ? 'Delete inquiry?'
            : `Delete ${deleteTarget?.ids.length ?? 0} inquiries?`
        }
        description="This permanently removes the selected inquiries from your inbox. The senders are not notified."
        itemName={deleteTarget?.label}
        confirmLabel="Delete"
        isDeleting={isDeleting}
      />
    </div>
  );
};
