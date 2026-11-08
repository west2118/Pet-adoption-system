import { useQuery } from '@tanstack/react-query';
import { Eye, Mail, MessageCircleQuestion } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
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

  const { emailMutation, isSending } = useShelterInquiryMutations({
    onEmailed: () => setEmailDraft(null),
    onConflict: () => setEmailDraft(null),
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
          description="Direct messages from adopters about your listings."
          icon={MessageCircleQuestion}
          toolbar={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <DebouncedSearchInput
                aria-label="Search inquiries"
                value={query}
                onDebouncedChange={(value) => {
                  setQuery(value);
                  setPage(1);
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
                  }}
                  options={INQUIRY_STATUS_FILTER_OPTIONS}
                />
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
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
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
                  <TableSkeletonRows columns={6} rows={5} avatar />
                ) : (
                  inquiries.map((inquiry) => {
                    const pet = petById.get(inquiry.petId);
                    return (
                      <TableRow key={inquiry.id}>
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
          <div className="grid gap-3 p-4 md:hidden">
            {showLoading ? (
              <RecordCardSkeleton count={3} />
            ) : (
              inquiries.map((inquiry) => (
                <InquiryMobileCard
                  key={inquiry.id}
                  inquiry={inquiry}
                  pet={petById.get(inquiry.petId)}
                  onView={() => setDetailsId(inquiry.id)}
                  onEmail={() => openEmailCompose(inquiry)}
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
    </div>
  );
};
