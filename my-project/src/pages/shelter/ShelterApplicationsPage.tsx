import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Search,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Container } from '@/components/layout/Container';
import { DetailsModal, RecordCard, SectionHeader, TableCard } from '@/components/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Input, Select } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';
import { ApplicationStatusBadge } from '@/components/ui/StatusBadge';
import { useApplications, usePets } from '@/hooks/useData';
import { applicationService } from '@/services/api';
import type { AdoptionApplication, ApplicationStatus } from '@/types';
import { formatDate } from '@/utils/formatters';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Under Review', label: 'Under Review' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Adopted', label: 'Adopted' },
];

const PAGE_SIZE = 8;

export const ShelterApplicationsPage = () => {
  const { pets } = usePets();
  const { applications, setApplications } = useApplications();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all');
  const [page, setPage] = useState(1);
  const [detailsApp, setDetailsApp] = useState<AdoptionApplication | null>(null);

  const filteredApplications = useMemo(() => {
    const search = query.trim().toLowerCase();
    return applications.filter((app) => {
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      const petName = pets.find((p) => p.id === app.petId)?.name ?? '';
      const matchesSearch =
        search === '' ||
        app.applicantName.toLowerCase().includes(search) ||
        app.email.toLowerCase().includes(search) ||
        petName.toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [applications, pets, statusFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pagedApplications = filteredApplications.slice(startIndex, startIndex + PAGE_SIZE);

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    const updated = await applicationService.updateStatus(id, status, 'Updated by staff');
    if (updated) {
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setDetailsApp((prev) => (prev && prev.id === id ? updated : prev));
    }
  };

  const toolbar = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search applications"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search applicant or pet"
          className="h-9 w-full pl-8 sm:w-[240px]"
        />
      </div>
      <Select
        aria-label="Filter by status"
        className="h-9 w-[180px]"
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value as 'all' | ApplicationStatus);
          setPage(1);
        }}
        options={STATUS_FILTER_OPTIONS}
      />
    </div>
  );

  const pagination =
    filteredApplications.length > 0 ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{startIndex + 1}</span>–
          <span className="font-medium text-foreground">
            {Math.min(startIndex + PAGE_SIZE, filteredApplications.length)}
          </span>{' '}
          of <span className="font-medium text-foreground">{filteredApplications.length}</span>{' '}
          applications
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

  const petOf = (petId: string) => pets.find((p) => p.id === petId);

  return (
    <Container className="py-6">
      <SectionHeader
        title="Adoption applications"
        subtitle="Review incoming requests, approve or reject, and keep staff notes."
      />

      <div className="mt-6 space-y-4">
        <TableCard
          title="Applications"
          description="Incoming adoption requests for your shelter's pets."
          icon={ClipboardList}
          toolbar={toolbar}
          isEmpty={filteredApplications.length === 0}
          emptyTitle="No applications found"
          emptyDescription="Try a different search or status filter."
          footer={pagination}
          contentClassName="px-0"
        >
          {/* Desktop: data table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pet</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedApplications.map((app) => {
                  const pet = petOf(app.petId);
                  return (
                    <TableRow key={app.id}>
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
                          <p className="font-medium">{app.applicantName}</p>
                          <p className="truncate text-xs text-muted-foreground">{app.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ApplicationStatusBadge status={app.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(app.submittedAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                            aria-label={`View ${app.applicantName} application`}
                            onClick={() => setDetailsApp(app)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-950/40"
                            aria-label={`Approve ${app.applicantName}`}
                            onClick={() => handleStatusChange(app.id, 'Approved')}
                          >
                            <Check className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                            aria-label={`Reject ${app.applicantName}`}
                            onClick={() => handleStatusChange(app.id, 'Rejected')}
                          >
                            <X className="size-4" />
                          </Button>
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
            {pagedApplications.map((app) => {
              const pet = petOf(app.petId);
              return (
                <RecordCard
                  key={app.id}
                  imageUrl={pet?.imageUrl}
                  imageAlt={pet?.name}
                  title={app.applicantName}
                  subtitle={app.email}
                  badges={<ApplicationStatusBadge status={app.status} />}
                  actions={
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                        aria-label={`View ${app.applicantName} application`}
                        onClick={() => setDetailsApp(app)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-950/40"
                        aria-label={`Approve ${app.applicantName}`}
                        onClick={() => handleStatusChange(app.id, 'Approved')}
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                        aria-label={`Reject ${app.applicantName}`}
                        onClick={() => handleStatusChange(app.id, 'Rejected')}
                      >
                        <X className="size-4" />
                      </Button>
                    </>
                  }
                >
                  <p className="text-sm text-muted-foreground">
                    Applying for{' '}
                    <span className="font-medium text-foreground">{pet?.name ?? '—'}</span>
                  </p>
                </RecordCard>
              );
            })}
          </div>
        </TableCard>
      </div>

      <DetailsModal
        open={detailsApp !== null}
        onClose={() => setDetailsApp(null)}
        title={detailsApp?.applicantName ?? 'Application details'}
        description={detailsApp ? `${detailsApp.email} · ${detailsApp.phone}` : undefined}
        icon={ClipboardList}
        footer={
          detailsApp ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-green-600 text-white hover:bg-green-700"
                onClick={() => handleStatusChange(detailsApp.id, 'Approved')}
              >
                <Check className="size-4" /> Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => handleStatusChange(detailsApp.id, 'Rejected')}
              >
                <X className="size-4" /> Reject
              </Button>
            </div>
          ) : undefined
        }
      >
        {detailsApp && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {petOf(detailsApp.petId) ? (
                <img
                  src={petOf(detailsApp.petId)?.imageUrl}
                  alt={petOf(detailsApp.petId)?.name}
                  className="size-14 rounded-lg object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{petOf(detailsApp.petId)?.name ?? 'Unknown pet'}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {petOf(detailsApp.petId)?.breed ?? '—'}
                </p>
              </div>
              <ApplicationStatusBadge status={detailsApp.status} />
            </div>

            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Housing</dt>
                <dd className="font-medium capitalize">{detailsApp.housingType}</dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Other pets</dt>
                <dd className="font-medium">{detailsApp.hasOtherPets ? 'Yes' : 'No'}</dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Phone</dt>
                <dd className="truncate font-medium">{detailsApp.phone}</dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Address</dt>
                <dd className="truncate font-medium">{detailsApp.address}</dd>
              </div>
            </dl>

            <div>
              <h3 className="text-sm font-semibold">Experience</h3>
              <p className="mt-1 text-sm text-muted-foreground">{detailsApp.experience}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Reason for adopting</h3>
              <p className="mt-1 text-sm text-muted-foreground">{detailsApp.reason}</p>
            </div>
            {detailsApp.staffNotes ? (
              <div>
                <h3 className="text-sm font-semibold">Staff notes</h3>
                <p className="mt-1 text-sm text-muted-foreground">{detailsApp.staffNotes}</p>
              </div>
            ) : null}

            <div>
              <h3 className="text-sm font-semibold">Status history</h3>
              <ol className="mt-2 space-y-1.5 text-sm">
                {detailsApp.history.map((h, i) => (
                  <li
                    key={`${h.status}-${h.date}-${i}`}
                    className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-1.5"
                  >
                    <span className="font-medium">{h.status}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(h.date)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </DetailsModal>
    </Container>
  );
};
