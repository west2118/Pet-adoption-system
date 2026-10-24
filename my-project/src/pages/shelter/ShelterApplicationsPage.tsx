import {
  AlertTriangle,
  Ban,
  Check,
  ClipboardList,
  Eye,
  HeartHandshake,
  Printer,
  Search,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  DetailsModal,
  RecordCard,
  RecordCardSkeleton,
  SectionHeader,
  TableCard,
  TablePagination,
  TableSkeletonRows,
} from '@/components/shared';
import { WaiverModal } from '@/components/features/WaiverModal';
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
import { ApplicationStatusBadge } from '@/components/ui/StatusBadge';
import { usePets } from '@/hooks/useData';
import { applicationService } from '@/services/api';
import { adoptionApplicationService } from '@/services/adoptionApplicationService';
import { sessionStore } from '@/lib/apiClient';
import type { AdoptionApplication, ApplicationStatus } from '@/types';
import { formatDate } from '@/utils/formatters';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Under Review', label: 'Under Review' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Cancelled', label: 'Cancelled' },
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
  const [decision, setDecision] = useState<{
    app: AdoptionApplication;
    status: 'Approved' | 'Rejected' | 'Cancelled';
  } | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [waiverAppId, setWaiverAppId] = useState<string | null>(null);
  // Opening details of a Submitted application moves it to Under Review once.
  const pendingReview = useRef<Set<string>>(new Set());

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

  const handleStatusChange = async (id: string, status: ApplicationStatus, note?: string) => {
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
        if (status === 'Cancelled') {
          // A cancelled adoption returns the pet to the adoptable pool.
          setPets((prev) =>
            prev.map((p) => (p.id === updated.petId ? { ...p, status: 'Available' } : p)),
          );
        }
      }
      setDetailsApp((prev) => (prev && prev.id === id ? updated : prev));
      return competitors.length;
    };

    try {
      // Dynamic path: persist in Postgres so the adopter sees the new status
      // on their Applications page immediately.
      if (sessionStore.has()) {
        try {
          const updated = await adoptionApplicationService.updateStatus(
            id,
            status,
            note ?? 'Updated by staff',
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
      const updated = await applicationService.updateStatus(
        id,
        status,
        note ?? 'Updated by staff',
      );
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
   * Approve / reject / cancel adoption are decisions, not one-click toggles —
   * confirm them in a modal first (with an optional note that is emailed).
   */
  const requestDecision = (
    app: AdoptionApplication,
    status: 'Approved' | 'Rejected' | 'Cancelled',
  ) => {
    setDetailsApp(null);
    setDecisionNote('');
    setDecision({ app, status });
  };

  const confirmDecision = async () => {
    if (!decision) return;
    setDeciding(true);
    const fallbackNote =
      decision.status === 'Approved'
        ? 'Application approved by shelter'
        : decision.status === 'Rejected'
          ? 'Application rejected by shelter'
          : 'Adoption cancelled by shelter';
    const ok = await handleStatusChange(
      decision.app.id,
      decision.status,
      decisionNote.trim() || fallbackNote,
    );
    setDeciding(false);
    if (ok) {
      setDecision(null);
      setDecisionNote('');
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

  /**
   * Approved applications move the pet to `In Process`, which the public
   * catalogue (`usePets`) filters out. Fall back to the pet summary joined
   * onto the application so the row keeps its name, photo and breed.
   */
  const petOf = (app: AdoptionApplication) =>
    pets.find((p) => p.id === app.petId) ?? app.pet;

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
    app.status === 'Adopted' || app.status === 'Rejected' || app.status === 'Cancelled';
  const isApproved = (app: AdoptionApplication) => app.status === 'Approved';

  /** Opening details marks a Submitted application as Under Review. */
  const openDetails = (app: AdoptionApplication) => {
    setDetailsApp(app);
    if (app.status !== 'Submitted' || pendingReview.current.has(app.id)) return;
    pendingReview.current.add(app.id);
    void handleStatusChange(app.id, 'Under Review', 'Application opened by shelter').finally(
      () => pendingReview.current.delete(app.id),
    );
  };

  /** Status-driven next step: Submitted/Under Review → Approve/Reject,
   *  Approved → Mark as adopted (then waiver print), Adopted/Rejected → terminal. */
  const approveAction = (app: AdoptionApplication) => (
    <Button
      variant="ghost"
      size="icon-sm"
      className="text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-950/40"
      aria-label={`Approve ${app.applicantName}`}
      onClick={() => requestDecision(app, 'Approved')}
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
      onClick={() => requestDecision(app, 'Rejected')}
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

  const cancelAdoptionAction = (app: AdoptionApplication) => (
    <Button
      variant="ghost"
      size="icon-sm"
      className="text-destructive hover:bg-destructive/10"
      aria-label={`Cancel adoption for ${app.applicantName}`}
      title="Cancel adoption"
      onClick={() => requestDecision(app, 'Cancelled')}
    >
      <Ban className="size-4" />
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

      <div className="mt-6 space-y-4">
        <TableCard
          title="Applications"
          description="Incoming adoption requests for your shelter's pets."
          icon={ClipboardList}
          toolbar={toolbar}
          isEmpty={!loading && applications.length === 0}
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
                {loading ? (
                  <TableSkeletonRows columns={5} rows={5} avatar />
                ) : applications.map((app) => {
                  const pet = petOf(app);
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
                            onClick={() => openDetails(app)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          {isApproved(app) ? (
                            <>
                              {markAdoptedAction(app)}
                              {cancelAdoptionAction(app)}
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
            {loading ? (
              <RecordCardSkeleton count={3} />
            ) : applications.map((app) => {
              const pet = petOf(app);
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
                        onClick={() => openDetails(app)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      {isApproved(app) ? (
                        <>
                          {markAdoptedAction(app)}
                          {cancelAdoptionAction(app)}
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
                <>
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => handleMarkAdopted(detailsApp.id)}
                  >
                    <HeartHandshake className="size-4" /> Mark as adopted & print e-waiver
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full"
                    onClick={() => requestDecision(detailsApp, 'Cancelled')}
                  >
                    <Ban className="size-4" /> Cancel adoption
                  </Button>
                </>
              ) : detailsApp.status === 'Adopted' ||
                detailsApp.status === 'Rejected' ||
                detailsApp.status === 'Cancelled' ? null : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 text-white hover:bg-green-700"
                    onClick={() => requestDecision(detailsApp, 'Approved')}
                  >
                    <Check className="size-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => requestDecision(detailsApp, 'Rejected')}
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
              {petOf(detailsApp) ? (
                <img
                  src={petOf(detailsApp)?.imageUrl}
                  alt={petOf(detailsApp)?.name}
                  className="size-14 rounded-lg object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{petOf(detailsApp)?.name ?? 'Unknown pet'}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {petOf(detailsApp)?.breed ?? '—'}
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

      <DetailsModal
        open={decision !== null}
        onClose={deciding ? () => undefined : () => setDecision(null)}
        title={
          decision?.status === 'Approved'
            ? 'Approve this application?'
            : decision?.status === 'Rejected'
              ? 'Reject this application?'
              : 'Cancel this adoption?'
        }
        description={
          decision ? `${decision.app.applicantName} · ${decision.app.email}` : undefined
        }
        icon={
          decision?.status === 'Approved'
            ? Check
            : decision?.status === 'Rejected'
              ? AlertTriangle
              : Ban
        }
      >
        {decision && (
          <div className="space-y-4">
            <div
              className={
                decision.status === 'Approved'
                  ? 'rounded-lg border border-green-600/30 bg-green-50 px-3 py-2.5 text-sm dark:bg-green-950/40'
                  : 'rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm'
              }
            >
              {decision.status === 'Cancelled' ? (
                <>
                  You are about to cancel the approved adoption of{' '}
                  <span className="font-semibold">
                    {petOf(decision.app)?.name ?? 'this pet'}
                  </span>{' '}
                  for{' '}
                  <span className="font-semibold">{decision.app.applicantName}</span>.
                </>
              ) : (
                <>
                  You are about to {decision.status === 'Approved' ? 'approve' : 'reject'}{' '}
                  <span className="font-semibold">{decision.app.applicantName}</span>&apos;s
                  application for{' '}
                  <span className="font-semibold">
                    {petOf(decision.app)?.name ?? 'this pet'}
                  </span>
                  .
                </>
              )}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The status will be set to{' '}
              <span className="font-medium text-foreground">{decision.status}</span>, and an email
              with this status is sent to the applicant&apos;s account email.
              {decision.status === 'Approved'
                ? ' Other open applications for this pet will be auto-rejected.'
                : ''}
              {decision.status === 'Cancelled'
                ? ' The pet will be returned to Available so other adopters can apply.'
                : ''}
            </p>
            <div>
              <Label htmlFor="decision-note">Note (optional)</Label>
              <Textarea
                id="decision-note"
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="Included in the email to the applicant…"
                disabled={deciding}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDecision(null)}
                disabled={deciding}
              >
                Keep application
              </Button>
              <Button
                variant={decision.status === 'Approved' ? 'default' : 'destructive'}
                className={
                  decision.status === 'Approved'
                    ? 'flex-1 bg-green-600 text-white hover:bg-green-700'
                    : 'flex-1'
                }
                onClick={() => void confirmDecision()}
                disabled={deciding}
              >
                {deciding
                  ? decision.status === 'Approved'
                    ? 'Approving…'
                    : decision.status === 'Rejected'
                      ? 'Rejecting…'
                      : 'Cancelling…'
                  : decision.status === 'Approved'
                    ? 'Approve application'
                    : decision.status === 'Rejected'
                      ? 'Reject application'
                      : 'Cancel adoption'}
              </Button>
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
