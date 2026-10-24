import { Eye, Mail, MessageCircleQuestion, Search } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Input, Label, Select, Textarea } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { usePets, useShelters } from '@/hooks/useData';
import { ApiError } from '@/lib/apiClient';
import {
  emailShelterInquiry,
  listShelterInquiriesPaginated,
  type Inquiry,
} from '@/services/api';
import { formatDate } from '@/utils/formatters';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
];

export const ShelterInquiriesPage = () => {
  const { user } = useAuth();
  const { pets } = usePets();
  const { shelters } = useShelters();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [totalInquiries, setTotalInquiries] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  // Reply compose dialog (kept separate so the details modal stays read-only).
  const [emailingId, setEmailingId] = useState<string | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const myShelterId = user?.shelterId ?? shelters[0]?.id ?? null;

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const isResolved = statusFilter === 'all' ? undefined : statusFilter === 'resolved';
      const res = await listShelterInquiriesPaginated({
        page,
        limit: pageSize,
        resolved: isResolved,
        search: query.trim(),
        shelterId: myShelterId,
      });
      setInquiries(res.items);
      setTotalInquiries(res.total);
    } catch {
      toast.error('Failed to load inquiries.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, query, myShelterId]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const detailsInquiry = inquiries.find((i) => i.id === detailsId) ?? null;
  const emailingInquiry = inquiries.find((i) => i.id === emailingId) ?? null;

  const petOf = (petId: string) => pets.find((p) => p.id === petId);

  const openEmailCompose = (inquiry: Inquiry) => {
    const pet = petOf(inquiry.petId);
    setEmailingId(inquiry.id);
    setEmailSubject(pet ? `Your inquiry about ${pet.name}` : 'Your inquiry');
    setEmailMessage('');
  };

  const closeEmailCompose = () => {
    if (sendingEmail) return;
    setEmailingId(null);
    setEmailSubject('');
    setEmailMessage('');
  };

  const handleSendEmail = async () => {
    if (!emailingInquiry) return;
    const subject = emailSubject.trim();
    const message = emailMessage.trim();
    if (!subject || !message) {
      toast.warning('Add a subject and message before sending.');
      return;
    }

    setSendingEmail(true);
    try {
      const result = await emailShelterInquiry(emailingInquiry.id, { subject, message });
      if (result.emailSent) {
        setInquiries((prev) =>
          prev.map((i) => (i.id === emailingInquiry.id ? result.inquiry : i)),
        );
        toast.success(`Email sent to ${emailingInquiry.fromEmail}.`);
        setEmailingId(null);
        setEmailSubject('');
        setEmailMessage('');
      } else if (result.emailStubbed) {
        toast.warning(
          'Email is not configured yet. Add your Gmail SMTP credentials to backend/.env.',
        );
      } else {
        toast.error('Email could not be sent. Please try again.');
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.info('An email has already been sent for this inquiry.');
        await fetchInquiries();
        setEmailingId(null);
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Failed to send email.');
      }
    } finally {
      setSendingEmail(false);
    }
  };

  const toolbar = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search inquiries"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search sender or pet"
          className="h-9 w-full pl-8 sm:w-[240px]"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label="Filter by status"
          className="h-9 w-[150px]"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as 'all' | 'open' | 'resolved');
            setPage(1);
          }}
          options={STATUS_FILTER_OPTIONS}
        />
      </div>
    </div>
  );

  const pagination =
    totalInquiries > 0 ? (
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
    ) : undefined;

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Inquiries inbox"
        subtitle="Messages from potential adopters about your pets."
      />

      <div className="mt-6 space-y-4">
        <TableCard
          title="Inquiries"
          description="Direct messages from adopters about your listings."
          icon={MessageCircleQuestion}
          toolbar={toolbar}
          isEmpty={!loading && inquiries.length === 0}
          emptyTitle="No inquiries found"
          emptyDescription="Try a different search or filter."
          footer={pagination}
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
                {loading ? (
                  <TableSkeletonRows columns={6} rows={5} avatar />
                ) : inquiries.map((inquiry) => {
                  const pet = petOf(inquiry.petId);
                  const resolved = inquiry.resolved ?? false;
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
                        <Badge variant={resolved ? 'success' : 'warning'}>
                          {resolved ? 'Resolved' : 'Open'}
                        </Badge>
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
                          {!inquiry.emailedAt ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/40"
                              aria-label={`Email ${inquiry.fromName}`}
                              onClick={() => openEmailCompose(inquiry)}
                            >
                              <Mail className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: stacked cards */}
          <div className="grid gap-3 p-4 md:hidden">
            {loading ? (
              <RecordCardSkeleton count={3} />
            ) : inquiries.map((inquiry) => {
              const pet = petOf(inquiry.petId);
              const resolved = inquiry.resolved ?? false;
              return (
                <RecordCard
                  key={inquiry.id}
                  imageUrl={pet?.imageUrl}
                  imageAlt={pet?.name}
                  title={inquiry.fromName}
                  subtitle={`${pet?.name ?? '—'} · ${formatDate(inquiry.createdAt)}`}
                  badges={
                    <Badge variant={resolved ? 'success' : 'warning'}>
                      {resolved ? 'Resolved' : 'Open'}
                    </Badge>
                  }
                  actions={
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                        aria-label={`View inquiry from ${inquiry.fromName}`}
                        onClick={() => setDetailsId(inquiry.id)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      {!inquiry.emailedAt ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/40"
                          aria-label={`Email ${inquiry.fromName}`}
                          onClick={() => openEmailCompose(inquiry)}
                        >
                          <Mail className="size-4" />
                        </Button>
                      ) : null}
                    </>
                  }
                >
                  <p className="line-clamp-2 text-sm text-muted-foreground">{inquiry.message}</p>
                </RecordCard>
              );
            })}
          </div>
        </TableCard>
      </div>

      {/* Read-only inquiry details */}
      <DetailsModal
        open={detailsInquiry !== null}
        onClose={() => setDetailsId(null)}
        title={detailsInquiry ? `Inquiry from ${detailsInquiry.fromName}` : 'Inquiry'}
        description={
          detailsInquiry ? `Received ${formatDate(detailsInquiry.createdAt)}` : undefined
        }
        icon={MessageCircleQuestion}
      >
        {detailsInquiry && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {petOf(detailsInquiry.petId) ? (
                <img
                  src={petOf(detailsInquiry.petId)?.imageUrl}
                  alt={petOf(detailsInquiry.petId)?.name}
                  className="size-14 rounded-lg object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {petOf(detailsInquiry.petId)?.name ?? 'Unknown pet'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {petOf(detailsInquiry.petId)?.breed ?? 'Pet inquiry'}
                </p>
              </div>
              <Badge variant={detailsInquiry.resolved ? 'success' : 'warning'}>
                {detailsInquiry.resolved ? 'Resolved' : 'Open'}
              </Badge>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">From</p>
              <p className="mt-1 text-sm font-medium">{detailsInquiry.fromName}</p>
              <p className="text-sm text-muted-foreground">{detailsInquiry.fromEmail}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Message</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
                {detailsInquiry.message}
              </p>
            </div>

            {detailsInquiry.emailedAt ? (
              <div className="rounded-lg border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Email sent
                </p>
                <p className="mt-1 text-sm font-medium">
                  {detailsInquiry.emailSubject ?? 'Reply'}
                </p>
                {detailsInquiry.emailMessage ? (
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {detailsInquiry.emailMessage}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  Sent to {detailsInquiry.fromEmail} on {formatDate(detailsInquiry.emailedAt)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No email has been sent to this inquirer yet.
              </p>
            )}
          </div>
        )}
      </DetailsModal>

      {/* Compose dialog for the Email action */}
      <SlideOver
        open={emailingInquiry !== null}
        onClose={closeEmailCompose}
        title={emailingInquiry ? `Email ${emailingInquiry.fromName}` : 'Email inquirer'}
        description={
          emailingInquiry
            ? `Reply about ${petOf(emailingInquiry.petId)?.name ?? 'this pet'} · ${emailingInquiry.fromEmail}`
            : undefined
        }
        icon={Mail}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={closeEmailCompose}
              disabled={sendingEmail}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSendEmail}
              disabled={sendingEmail || !emailSubject.trim() || !emailMessage.trim()}
            >
              {sendingEmail ? 'Sending…' : 'Send email'}
            </Button>
          </div>
        }
      >
        {emailingInquiry && (
          <div className="space-y-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">To</p>
              <p className="mt-1 text-sm font-medium">{emailingInquiry.fromName}</p>
              <p className="text-sm text-muted-foreground">{emailingInquiry.fromEmail}</p>
            </div>

            <div className="rounded-lg bg-muted/60 px-3 py-2">
              <p className="text-xs font-semibold">Their message</p>
              <p className="mt-0.5 whitespace-pre-line text-sm">{emailingInquiry.message}</p>
            </div>

            <div>
              <Label htmlFor="inquiry-email-subject">Subject</Label>
              <Input
                id="inquiry-email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                maxLength={200}
              />
            </div>

            <div>
              <Label htmlFor="inquiry-email-message">Message</Label>
              <Textarea
                id="inquiry-email-message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder={`Write your reply to ${emailingInquiry.fromName}…`}
                className="min-h-40"
                maxLength={5000}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              This sends once through the shelter's email. After it is delivered, the Email
              action is hidden.
            </p>
          </div>
        )}
      </SlideOver>
    </div>
  );
};
