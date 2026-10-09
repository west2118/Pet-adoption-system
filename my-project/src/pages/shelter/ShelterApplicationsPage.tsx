import {
  Check,
  ClipboardList,
  Eye,
  HeartHandshake,
  Printer,
  Search,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { DetailsModal, RecordCard, SectionHeader, TableCard, TablePagination } from '@/components/shared';
import { WaiverModal } from '@/components/features/WaiverModal';
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
import { usePets } from '@/hooks/useData';
import { applicationService } from '@/services/api';
import { adoptionApplicationService } from '@/services/adoptionApplicationService';
import { tokenStore } from '@/lib/apiClient';
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

export const ShelterApplicationsPage = () => {
  const { pets, setPets } = usePets();

  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [totalApplications, setTotalApplications] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailsApp, setDetailsApp] = useState<AdoptionApplication | null>(null);
  const [waiverAppId, setWaiverAppId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adoptionApplicationService.listForShelterPaginated({
        page,
        limit: pageSize,
        status: statusFilter,
        search: query.trim(),
      });
      setApplications(res.items);
      setTotalApplications(res.total);
    } catch {
      toast.error('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, query]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const waiverApp = waiverAppId
    ? (applications.find((a) => a.id === waiverAppId) ?? null)
    : null;

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    // Local mirror of the server rule: accepting one application auto-rejects
    // the other open ones for the same pet and moves the pet itself, so the
    // table stays correct without a refetch.
    const syncAcceptanceSideEffects = (updated: AdoptionApplication) => {
      const rejectable: ApplicationStatus[] =
        status === 'Approved'
          ? ['Submitted', 'Under Review']
          : status === 'Adopted'
            ? ['Submitted', 'Under Review', 'Approved']
            : [];
      const competitors = applications.filter(
        (a) => a.id !== updated.id && a.petId === updated.petId && rejectable.includes(a.status),
      );
      if (rejectable.length > 0) {
        const today = new Date().toISOString().slice(0, 10);
        const autoNote =
          status === 'Approved'
            ? 'Auto-rejected: another application for this pet was accepted.'
            : 'Auto-rejected: this pet has been adopted.';
        setApplications((prev) =>
          prev.map((a) => {
            if (a.id === updated.id) return updated;
            if (a.petId === updated.petId && rejectable.includes(a.status)) {
              return {
                ...a,
                status: 'Rejected' as ApplicationStatus,
                updatedAt: today,
                staffNotes: autoNote,
                history: [
                  ...a.history,
                  { status: 'Rejected' as ApplicationStatus, date: today, note: autoNote },
                ],
              };
            }
            return a;
          }),
        );
        const petStatus = status === 'Approved' ? ('In Process' as const) : ('Adopted' as const);
        setPets((prev) => prev.map((p) => (p.id === updated.petId ? { ...p, status: petStatus } : p)));
      } else {
        setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
      }
      setDetailsApp((prev) => (prev && prev.id === id ? updated : prev));
      return competitors.length;
    };

    try {
      // Dynamic path: persist in Postgres so the adopter sees the new status
      // on their Applications page immediately.
      if (tokenStore.get()) {
        try {
          const updated = await adoptionApplicationService.updateStatus(
            id,
            status,
            'Updated by staff',
          );
          const autoRejected = syncAcceptanceSideEffects(updated);
          toast.success(`Application ${status.toLowerCase()}!`);
          if (autoRejected > 0) {
            toast.info(
              `${autoRejected} competing application${autoRejected === 1 ? '' : 's'} auto-rejected.`,
            );
          }
          return true;
        } catch {
          // fall through to the local mock store (demo mode / unreachable API)
        }
      }
      const updated = await applicationService.updateStatus(id, status, 'Updated by staff');
      if (updated) {
        const autoRejected = syncAcceptanceSideEffects(updated);
        toast.success(`Application ${status.toLowerCase()}!`);
        if (autoRejected > 0) {
          toast.info(
            `${autoRejected} competing application${autoRejected === 1 ? '' : 's'} auto-rejected.`,
          );
        }
        return true;
      }
      return false;
    } catch {
      toast.error('Failed to update application status. Please try again.');
      return false;
    }
  };

  /**
   * Approved is not terminal — the next step is handover. Marking as adopted
   * flips the pet to Adopted, then opens the e-waiver print modal so staff
   * can generate / print the handover documents immediately (no navigation).
   */
  const openWaiver = (id: string) => {
    setDetailsApp(null);
    setWaiverAppId(id);
  };

  const handleMarkAdopted = async (id: string) => {
    const ok = await handleStatusChange(id, 'Adopted');
    if (ok) openWaiver(id);
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
    totalApplications > 0 ? (
      <TablePagination
        currentPage={page}
        totalItems={totalApplications}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        label="applications"
      />
    ) : undefined;

  const petOf = (petId: string) => pets.find((p) => p.id === petId);

  /** E-waivers are only printable once the pet is being handed over. */
  const canPrintWaiver = (app: AdoptionApplication) =>
    app.status === 'Approved' || app.status === 'Adopted';

  const waiverAction = (app: AdoptionApplication, label: string) =>
    canPrintWaiver(app) ? (
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground"
        aria-label={label}
        title="Open e-waiver"
        onClick={() => openWaiver(app.id)}
      >
        <Printer className="size-4" />
      </Button>
    ) : null;

  const isTerminal = (app: AdoptionApplication) =>
    app.status === 'Adopted' || app.status === 'Rejected';
  const isApproved = (app: AdoptionApplication) => app.status === 'Approved';

  /** Status-driven next step: Submitted/Under Review → Approve/Reject,
   *  Approved → Mark as adopted (then waiver print), Adopted/Rejected → terminal. */
  const approveAction = (app: AdoptionApplication) => (
    <Button
      variant="ghost"
      size="icon-sm"
      className="text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-950/40"
      aria-label={`Approve ${app.applicantName}`}
      onClick={() => handleStatusChange(app.id, 'Approved')}
    >
      <Check className="size-4" />
    </Button>
  );

  const rejectAction = (app: AdoptionApplication) => (
    <Button
      variant="ghost"
      size="icon-sm"
      className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
      aria-label={`Reject ${app.applicantName}`}
      onClick={() => handleStatusChange(app.id, 'Rejected')}
    >
      <X className="size-4" />
    </Button>
  );

  const markAdoptedAction = (app: AdoptionApplication) => (
    <Button
      variant="ghost"
      size="icon-sm"
      className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
      aria-label={`Mark ${app.applicantName} as adopted`}
      title="Mark as adopted & print e-waiver"
      onClick={() => handleMarkAdopted(app.id)}
    >
      <HeartHandshake className="size-4" />
    </Button>
  );

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Adoption applications"
        subtitle="Review incoming requests, approve or reject, and keep staff notes."
        actions={
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
        }
      />
      {loading && (
        <p className="mt-4 text-sm text-muted-foreground">Loading applications…</p>
      )}

      <div className="mt-6 space-y-4">
        <TableCard
          title="Applications"
          description="Incoming adoption requests for your shelter's pets."
          icon={ClipboardList}
          toolbar={toolbar}
          isEmpty={applications.length === 0}
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
                {applications.map((app) => {
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
                          {isApproved(app) ? (
                            <>
                              {markAdoptedAction(app)}
                              {waiverAction(app, `Print e-waiver for ${app.applicantName}`)}
                            </>
                          ) : isTerminal(app) ? (
                            waiverAction(app, `Print e-waiver for ${app.applicantName}`)
                          ) : (
                            <>
                              {approveAction(app)}
                              {rejectAction(app)}
                            </>
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
            {applications.map((app) => {
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
                      {isApproved(app) ? (
                        <>
                          {markAdoptedAction(app)}
                          {waiverAction(app, `Print e-waiver for ${app.applicantName}`)}
                        </>
                      ) : isTerminal(app) ? (
                        waiverAction(app, `Print e-waiver for ${app.applicantName}`)
                      ) : (
                        <>
                          {approveAction(app)}
                          {rejectAction(app)}
                        </>
                      )}
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
            <div className="flex flex-col gap-2">
              {canPrintWaiver(detailsApp) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => openWaiver(detailsApp.id)}
                >
                  <Printer className="size-3.5" /> Print e-waiver
                </Button>
              )}
              {detailsApp.status === 'Approved' ? (
                <Button
                  size="sm"
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => handleMarkAdopted(detailsApp.id)}
                >
                  <HeartHandshake className="size-4" /> Mark as adopted & print e-waiver
                </Button>
              ) : detailsApp.status === 'Adopted' || detailsApp.status === 'Rejected' ? null : (
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
              )}
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

      <WaiverModal
        key={waiverAppId ?? 'closed'}
        open={waiverAppId !== null}
        onClose={() => setWaiverAppId(null)}
        applicationId={waiverAppId}
        applicantName={waiverApp?.applicantName}
      />
    </div>
  );
};
