import {
  Check,
  Eye,
  MessageCircleQuestion,
  RotateCcw,
  Search,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { DetailsModal, RecordCard, SectionHeader, TableCard, TablePagination } from '@/components/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Input, Textarea, Label } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { usePets, useShelters } from '@/hooks/useData';
import { listShelterInquiriesPaginated, type Inquiry } from '@/services/api';
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
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [resolved, setResolved] = useState<Set<string>>(new Set());

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

  const petOf = (petId: string) => pets.find((p) => p.id === petId);

  const toggleResolved = (id: string) => {
    setResolved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.info('Inquiry reopened.');
      } else {
        next.add(id);
        toast.success('Inquiry marked as resolved!');
      }
      return next;
    });
  };

  const sendReply = (id: string) => {
    const text = (drafts[id] ?? '').trim();
    if (!text) {
      toast.warning('Please write a reply before sending.');
      return;
    }
    setReplies((prev) => ({ ...prev, [id]: text }));
    setDrafts((prev) => ({ ...prev, [id]: '' }));
    toast.success('Reply sent to adopter!');
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
        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          {STATUS_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setStatusFilter(option.value as 'all' | 'open' | 'resolved');
                setPage(1);
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
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
      {loading && (
        <p className="mt-4 text-sm text-muted-foreground">Loading inquiries…</p>
      )}

      <div className="mt-6 space-y-4">
        <TableCard
          title="Inquiries"
          description="Direct messages from adopters about your listings."
          icon={MessageCircleQuestion}
          toolbar={toolbar}
          isEmpty={inquiries.length === 0}
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
                {inquiries.map((inquiry) => {
                  const pet = petOf(inquiry.petId);
                  const isResolved = resolved.has(inquiry.id);
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
                        <Badge variant={isResolved ? 'success' : 'warning'}>
                          {isResolved ? 'Resolved' : 'Open'}
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
                          {isResolved ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
                              aria-label={`Reopen inquiry from ${inquiry.fromName}`}
                              onClick={() => toggleResolved(inquiry.id)}
                            >
                              <RotateCcw className="size-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-950/40"
                              aria-label={`Mark inquiry from ${inquiry.fromName} resolved`}
                              onClick={() => toggleResolved(inquiry.id)}
                            >
                              <Check className="size-4" />
                            </Button>
                          )}
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
            {inquiries.map((inquiry) => {
              const pet = petOf(inquiry.petId);
              const isResolved = resolved.has(inquiry.id);
              return (
                <RecordCard
                  key={inquiry.id}
                  imageUrl={pet?.imageUrl}
                  imageAlt={pet?.name}
                  title={inquiry.fromName}
                  subtitle={`${pet?.name ?? '—'} · ${formatDate(inquiry.createdAt)}`}
                  badges={
                    <Badge variant={isResolved ? 'success' : 'warning'}>
                      {isResolved ? 'Resolved' : 'Open'}
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
                      {isResolved ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
                          aria-label={`Reopen inquiry from ${inquiry.fromName}`}
                          onClick={() => toggleResolved(inquiry.id)}
                        >
                          <RotateCcw className="size-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-950/40"
                          aria-label={`Mark inquiry from ${inquiry.fromName} resolved`}
                          onClick={() => toggleResolved(inquiry.id)}
                        >
                          <Check className="size-4" />
                        </Button>
                      )}
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

      <DetailsModal
        open={detailsInquiry !== null}
        onClose={() => setDetailsId(null)}
        title={detailsInquiry?.fromName ?? 'Inquiry'}
        description={detailsInquiry ? detailsInquiry.fromEmail : undefined}
        icon={MessageCircleQuestion}
        footer={
          detailsInquiry ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => sendReply(detailsInquiry.id)}
                disabled={!(drafts[detailsInquiry.id] ?? '').trim()}
              >
                Send reply
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleResolved(detailsInquiry.id)}
              >
                {resolved.has(detailsInquiry.id) ? 'Reopen' : 'Mark resolved'}
              </Button>
            </div>
          ) : undefined
        }
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
                  Received {formatDate(detailsInquiry.createdAt)}
                </p>
              </div>
              <Badge variant={resolved.has(detailsInquiry.id) ? 'success' : 'warning'}>
                {resolved.has(detailsInquiry.id) ? 'Resolved' : 'Open'}
              </Badge>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-sm">{detailsInquiry.message}</p>
            </div>

            {replies[detailsInquiry.id] ? (
              <div className="rounded-lg bg-muted/60 px-3 py-2">
                <p className="text-xs font-semibold">Your reply</p>
                <p className="mt-0.5 text-sm">{replies[detailsInquiry.id]}</p>
              </div>
            ) : null}

            <div>
              <Label htmlFor={`reply-${detailsInquiry.id}`}>Reply</Label>
              <Textarea
                id={`reply-${detailsInquiry.id}`}
                value={drafts[detailsInquiry.id] ?? ''}
                onChange={(e) =>
                  setDrafts((prev) => ({ ...prev, [detailsInquiry.id]: e.target.value }))
                }
                placeholder="Write a reply…"
              />
            </div>
          </div>
        )}
      </DetailsModal>
    </div>
  );
};
