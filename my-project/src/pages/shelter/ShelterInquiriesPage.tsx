import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageCircleQuestion,
  RotateCcw,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { DetailsModal, RecordCard, SectionHeader, TableCard } from '@/components/shared';
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
import { mockInquiries } from '@/data/mockData';
import { formatDate } from '@/utils/formatters';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
];

const PAGE_SIZE = 8;

export const ShelterInquiriesPage = () => {
  const { user } = useAuth();
  const { pets } = usePets();
  const { shelters } = useShelters();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [page, setPage] = useState(1);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const petOf = (petId: string) => pets.find((p) => p.id === petId);

  // Only inquiries about this shelter's own pets — other shelters' pets
  // (and their messages) are never listed here.
  const myShelterId = user?.shelterId ?? shelters[0]?.id ?? null;

  const filteredInquiries = useMemo(() => {
    const search = query.trim().toLowerCase();
    return mockInquiries.filter((inquiry) => {
      const pet = pets.find((p) => p.id === inquiry.petId);
      if (myShelterId && pet?.shelterId !== myShelterId) return false;
      const isResolved = resolved.has(inquiry.id);
      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'resolved') === isResolved;
      const petName = pet?.name ?? '';
      const matchesSearch =
        search === '' ||
        inquiry.fromName.toLowerCase().includes(search) ||
        inquiry.fromEmail.toLowerCase().includes(search) ||
        inquiry.message.toLowerCase().includes(search) ||
        petName.toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [pets, resolved, statusFilter, query, myShelterId]);

  const totalPages = Math.max(1, Math.ceil(filteredInquiries.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pagedInquiries = filteredInquiries.slice(startIndex, startIndex + PAGE_SIZE);

  const detailsInquiry = mockInquiries.find((i) => i.id === detailsId) ?? null;

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
    filteredInquiries.length > 0 ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{startIndex + 1}</span>–
          <span className="font-medium text-foreground">
            {Math.min(startIndex + PAGE_SIZE, filteredInquiries.length)}
          </span>{' '}
          of <span className="font-medium text-foreground">{filteredInquiries.length}</span>{' '}
          inquiries
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="size-4" /> Prev
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Button
              key={n}
              variant={n === currentPage ? 'default' : 'outline'}
              size="icon-sm"
              aria-label={`Go to page ${n}`}
              aria-current={n === currentPage ? 'page' : undefined}
              onClick={() => setPage(n)}
            >
              {n}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
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
          isEmpty={filteredInquiries.length === 0}
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
                {pagedInquiries.map((inquiry) => {
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
            {pagedInquiries.map((inquiry) => {
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
