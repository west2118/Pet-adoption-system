import {
  AlertTriangle,
  Ban,
  Check,
  ClipboardList,
  Eye,
  HeartHandshake,
  Printer,
  Search,
  Undo2,
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
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { ApplicationStatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { usePets } from '@/hooks/useData';
import { applicationService } from '@/services/api';
import { adoptionApplicationService } from '@/services/adoptionApplicationService';
import { ApiError, sessionStore } from '@/lib/apiClient';
import type { AdoptionApplication, ApplicationStatus } from '@/types';
import { formatDate, formatDateTime } from '@/utils/formatters';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Under Review', label: 'Under Review' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Adopted', label: 'Adopted' },
  { value: 'Returned', label: 'Returned' },
];

/**
 * What the shelter is about to do. `Return` reverses a completed handover and
 * is persisted as the application's `Cancelled` status.
 */
type DecisionAction = 'Approved' | 'Rejected' | 'Cancelled' | 'Adopted' | 'Return';

const waiverStatusOf = (app: AdoptionApplication) => app.waiverStatus ?? 'None';

/** Small at-a-glance handover-document state used in tables, cards, details. */
const WaiverStatusIndicator = ({ app }: { app: AdoptionApplication }) => {
  const status = waiverStatusOf(app);
  if (status === 'Signed') {
    return (
      <Badge
        variant="success"
        title={
          app.waiverSignedAt
            ? `Signed ${formatDateTime(app.waiverSignedAt)}`
            : 'Signed waiver on file'
        }
      >
        Signed{app.waiverVersion ? ` v${app.waiverVersion}` : ''}
      </Badge>
    );
  }
  if (status === 'Issued') {
    return (
      <Badge variant="info" title="Issued but waiting for the adopter's signature">
        Issued{app.waiverVersion ? ` v${app.waiverVersion}` : ''}
      </Badge>
    );
  }
  if (app.status === 'Adopted') {
    return (
      <Badge variant="destructive" title="Adopted without handover documents on file">
        Missing
      </Badge>
    );
  }
  if (app.status === 'Approved') {
    return (
      <Badge variant="warning" title="Generate the waiver before completing the adoption">
        Not issued
      </Badge>
    );
  }
  return <span className="text-xs text-muted-foreground">—</span>;
};

/** `datetime-local` value for "now" in the browser's own timezone. */
const nowForDateTimeInput = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export const ShelterApplicationsPage = () => {
  const { pets, setPets } = usePets();
  const { user } = useAuth();

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
    action: DecisionAction;
  } | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  // Pickup appointment collected before an application is approved.
  const [pickupAt, setPickupAt] = useState('');
  const [pickupEmail, setPickupEmail] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [waiverAppId, setWaiverAppId] = useState<string | null>(null);
  // When adoption is requested before a waiver exists, the waiver modal opens
  // first and this pending record completes the status change after issue.
  const [pendingAdoption, setPendingAdoption] = useState<{
    id: string;
    note: string;
  } | null>(null);
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
    // Initial load and filter/search changes; refresh owns the loading flag.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const waiverApp = waiverAppId
    ? (applications.find((a) => a.id === waiverAppId) ?? null)
    : null;

  const handleStatusChange = async (
    id: string,
    status: ApplicationStatus,
    note?: string,
    pickup?: { pickupAt: string; pickupEmail: string },
  ) => {
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
        if (status === 'Cancelled' || status === 'Returned') {
          // A cancelled or returned adoption puts the pet back in the pool.
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
            pickup,
          );
          const autoRejected = syncAcceptanceSideEffects(updated);
          toast.success(`Application ${status.toLowerCase()}!`);
          if (autoRejected > 0) {
            toast.info(
              `${autoRejected} competing application${autoRejected === 1 ? '' : 's'} auto-rejected.`,
            );
          }
          return true;
        } catch (err) {
          // Surface real server rules (e.g. a missing waiver) instead of
          // completing the action against the demo store.
          if (err instanceof ApiError && ![0, 401, 403].includes(err.status)) {
            toast.error(err.message);
            return false;
          }
          // fall through to the local mock store (demo mode / unreachable API)
        }
      }
      const updated = await applicationService.updateStatus(
        id,
        status,
        note ?? 'Updated by staff',
        pickup,
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
   * Approve / reject / cancel adoption / complete the handover are decisions,
   * not one-click toggles — confirm them in a modal first (with an optional note
   * that is emailed).
   */
  const requestDecision = (app: AdoptionApplication, action: DecisionAction) => {
    setDetailsApp(null);
    setDecisionNote('');
    // Approving books the clinic pickup, so start from an empty appointment and
    // the signed-in staff address as the default contact.
    setPickupAt('');
    setPickupEmail(action === 'Approved' ? (user?.email ?? '') : '');
    setDecision({ app, action });
  };

  const confirmDecision = async () => {
    if (!decision) return;

    // Handover documents are mandatory. If none exist yet, open the waiver
    // builder first; `handleWaiverGenerated` finishes the adoption afterwards.
    const currentApp = applications.find((app) => app.id === decision.app.id) ?? decision.app;
    if (decision.action === 'Adopted' && waiverStatusOf(currentApp) === 'None') {
      setDecision(null);
      setDetailsApp(null);
      setPendingAdoption({
        id: decision.app.id,
        note: decisionNote.trim() || 'Adoption completed by shelter',
      });
      setDecisionNote('');
      setPickupAt('');
      setPickupEmail('');
      setWaiverAppId(decision.app.id);
      return;
    }

    let pickup: { pickupAt: string; pickupEmail: string } | undefined;
    if (decision.action === 'Approved') {
      const email = pickupEmail.trim();
      if (!pickupAt) {
        toast.error('Choose the date and time the adopter can pick up the pet.');
        return;
      }
      if (!email) {
        toast.error('Enter the email the adopter should contact about the pickup.');
        return;
      }
      const when = new Date(pickupAt);
      // Event-handler validation: compare against the current clock once.
      // eslint-disable-next-line react-hooks/purity
      if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
        toast.error('The pickup date and time must be in the future.');
        return;
      }
      pickup = { pickupAt: when.toISOString(), pickupEmail: email };
    }

    const nextStatus: ApplicationStatus =
      decision.action === 'Return' ? 'Returned' : decision.action;
    const fallbackNote =
      decision.action === 'Approved'
        ? 'Application approved by shelter'
        : decision.action === 'Adopted'
          ? 'Adoption completed by shelter'
          : decision.action === 'Rejected'
            ? 'Application rejected by shelter'
            : decision.action === 'Return'
              ? 'Adopted pet returned to the shelter'
              : 'Adoption cancelled by shelter';

    setDeciding(true);
    const ok = await handleStatusChange(
      decision.app.id,
      nextStatus,
      decisionNote.trim() || fallbackNote,
      pickup,
    );
    setDeciding(false);
    if (ok) {
      const adoptedId = decision.action === 'Adopted' ? decision.app.id : null;
      setDecision(null);
      setDecisionNote('');
      setPickupAt('');
      setPickupEmail('');
      // Handover complete — open the e-waiver so staff can print the documents
      // immediately (no navigation).
      if (adoptedId) openWaiver(adoptedId);
    }
  };

  /**
   * Approved is not terminal — the next step is handover. Marking as adopted
   * flips the pet to Adopted, then opens the e-waiver print modal so staff
   * can generate / print the handover documents immediately (no navigation).
   */
  const openWaiver = (id: string) => {
    setDetailsApp(null);
    setPendingAdoption(null);
    setWaiverAppId(id);
  };

  /** Complete a pending adoption once the waiver has been issued. */
  const handleWaiverGenerated = async () => {
    if (!pendingAdoption) {
      await refresh();
      return;
    }
    const ok = await handleStatusChange(
      pendingAdoption.id,
      'Adopted',
      pendingAdoption.note,
    );
    if (ok) setPendingAdoption(null);
    await refresh();
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
    app.status === 'Adopted' ||
    app.status === 'Rejected' ||
    app.status === 'Cancelled' ||
    app.status === 'Returned';
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
      title={
        waiverStatusOf(app) === 'None'
          ? 'Generate the e-waiver & mark as adopted'
          : 'Mark as adopted & open e-waiver'
      }
      onClick={() => requestDecision(app, 'Adopted')}
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

  /** Completed handover → the pet comes back to the shelter (pet Available). */
  const returnAction = (app: AdoptionApplication) => (
    <Button
      variant="ghost"
      size="icon-sm"
      className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/40"
      aria-label={`Return ${petOf(app)?.name ?? 'pet'} to the shelter`}
      title="Return pet to the shelter"
      onClick={() => requestDecision(app, 'Return')}
    >
      <Undo2 className="size-4" />
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
                  <TableHead>Waiver</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeletonRows columns={6} rows={5} avatar />
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
                      <TableCell>
                        <WaiverStatusIndicator app={app} />
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
                          ) : app.status === 'Adopted' ? (
                            // A completed handover can still be reversed when
                            // the pet is returned to the shelter.
                            <>
                              {returnAction(app)}
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
                  badges={
                    <>
                      <ApplicationStatusBadge status={app.status} />
                      <WaiverStatusIndicator app={app} />
                    </>
                  }
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
                      ) : app.status === 'Adopted' ? (
                        <>
                          {returnAction(app)}
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
                    onClick={() => requestDecision(detailsApp, 'Adopted')}
                  >
                    <HeartHandshake className="size-4" />
                    {waiverStatusOf(detailsApp) === 'None'
                      ? 'Generate waiver & mark adopted'
                      : 'Mark as adopted & open e-waiver'}
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
              ) : detailsApp.status === 'Adopted' ? (
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full"
                  onClick={() => requestDecision(detailsApp, 'Return')}
                >
                  <Undo2 className="size-4" /> Return pet to the shelter
                </Button>
              ) : detailsApp.status === 'Rejected' ||
                detailsApp.status === 'Cancelled' ||
                detailsApp.status === 'Returned' ? null : (
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
              <div className="flex flex-col items-end gap-1">
                <ApplicationStatusBadge status={detailsApp.status} />
                <WaiverStatusIndicator app={detailsApp} />
              </div>
            </div>

            {waiverStatusOf(detailsApp) === 'None' && detailsApp.status === 'Approved' ? (
              <p className="rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                No handover waiver has been issued. Marking this adoption as complete will open
                the waiver builder first.
              </p>
            ) : null}
            {waiverStatusOf(detailsApp) === 'None' && detailsApp.status === 'Adopted' ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                This adoption has no waiver on file. Generate one now to complete the handover
                record.
              </p>
            ) : null}

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

            {detailsApp.pickupAt ? (
              <div className="rounded-lg border border-green-600/30 bg-green-50/60 p-3 dark:bg-green-950/20">
                <h3 className="text-sm font-semibold">Pickup scheduled</h3>
                <p className="mt-1 text-sm">{formatDateTime(detailsApp.pickupAt)}</p>
                {detailsApp.pickupEmail ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Contact:{' '}
                    <a
                      className="underline underline-offset-2"
                      href={`mailto:${detailsApp.pickupEmail}`}
                    >
                      {detailsApp.pickupEmail}
                    </a>
                  </p>
                ) : null}
              </div>
            ) : null}

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
          decision?.action === 'Approved'
            ? 'Approve this application?'
            : decision?.action === 'Adopted'
              ? 'Mark this adoption as complete?'
              : decision?.action === 'Return'
                ? 'Return this pet to the shelter?'
                : decision?.action === 'Rejected'
                  ? 'Reject this application?'
                  : 'Cancel this adoption?'
        }
        description={
          decision ? `${decision.app.applicantName} · ${decision.app.email}` : undefined
        }
        icon={
          decision?.action === 'Approved'
            ? Check
            : decision?.action === 'Adopted'
              ? HeartHandshake
              : decision?.action === 'Return'
                ? Undo2
                : decision?.action === 'Rejected'
                  ? AlertTriangle
                  : Ban
        }
      >
        {decision && (
          <div className="space-y-4">
            <div
              className={
                decision.action === 'Approved'
                  ? 'rounded-lg border border-green-600/30 bg-green-50 px-3 py-2.5 text-sm dark:bg-green-950/40'
                  : decision.action === 'Adopted'
                    ? 'rounded-lg border border-blue-600/30 bg-blue-50 px-3 py-2.5 text-sm dark:bg-blue-950/40'
                    : decision.action === 'Return'
                      ? 'rounded-lg border border-amber-600/30 bg-amber-50 px-3 py-2.5 text-sm dark:bg-amber-950/40'
                      : 'rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm'
              }
            >
              {decision.action === 'Return' ? (
                <>
                  You are about to return{' '}
                  <span className="font-semibold">
                    {petOf(decision.app)?.name ?? 'this pet'}
                  </span>{' '}
                  from{' '}
                  <span className="font-semibold">{decision.app.applicantName}</span>. The adoption
                  ends and the pet goes back up for adoption.
                </>
              ) : decision.action === 'Cancelled' ? (
                <>
                  You are about to cancel the approved adoption of{' '}
                  <span className="font-semibold">
                    {petOf(decision.app)?.name ?? 'this pet'}
                  </span>{' '}
                  for{' '}
                  <span className="font-semibold">{decision.app.applicantName}</span>.
                </>
              ) : decision.action === 'Adopted' ? (
                <>
                  You are about to complete{' '}
                  <span className="font-semibold">{decision.app.applicantName}</span>&apos;s
                  adoption of{' '}
                  <span className="font-semibold">
                    {petOf(decision.app)?.name ?? 'this pet'}
                  </span>
                  .
                </>
              ) : (
                <>
                  You are about to {decision.action === 'Approved' ? 'approve' : 'reject'}{' '}
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
              {decision.action === 'Return' ? (
                <>
                  The adoption ends, the application is marked{' '}
                  <span className="font-medium text-foreground">Returned</span>, and an email is
                  sent to the applicant&apos;s account email. The pet returns to{' '}
                  <span className="font-medium text-foreground">Available</span> and the pickup
                  appointment is cleared.
                </>
              ) : (
                <>
                  The status will be set to{' '}
                  <span className="font-medium text-foreground">{decision.action}</span>, and an
                  email with this status is sent to the applicant&apos;s account email.
                  {decision.action === 'Approved'
                    ? ' The adopter is emailed this pickup appointment, and other open applications for this pet will be auto-rejected.'
                    : ''}
                  {decision.action === 'Adopted'
                    ? waiverStatusOf(
                        applications.find((app) => app.id === decision.app.id) ?? decision.app,
                      ) === 'None'
                      ? ' This adoption has no e-waiver yet. The waiver builder opens first; the adoption is completed automatically after the waiver is issued.'
                      : ' The pet becomes Adopted, any other open applications for it are auto-rejected, and the e-waiver opens so you can print the handover documents.'
                    : ''}
                  {decision.action === 'Cancelled'
                    ? ' The pet will be returned to Available so other adopters can apply.'
                    : ''}
                </>
              )}
            </p>
            {decision.action === 'Approved' && (
              <div className="space-y-3 rounded-lg border border-green-600/30 bg-green-50/60 p-3 dark:bg-green-950/20">
                <div>
                  <Label htmlFor="pickup-at">Clinic pickup date &amp; time</Label>
                  <Input
                    id="pickup-at"
                    type="datetime-local"
                    min={nowForDateTimeInput()}
                    value={pickupAt}
                    onChange={(e) => setPickupAt(e.target.value)}
                    disabled={deciding}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pickup-email">Pickup contact email</Label>
                  <Input
                    id="pickup-email"
                    type="email"
                    value={pickupEmail}
                    onChange={(e) => setPickupEmail(e.target.value)}
                    placeholder="clinic@example.com"
                    disabled={deciding}
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Shown to the adopter so they can ask about the appointment.
                  </p>
                </div>
              </div>
            )}
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
                variant={
                  decision.action === 'Rejected' ||
                  decision.action === 'Cancelled' ||
                  decision.action === 'Return'
                    ? 'destructive'
                    : 'default'
                }
                className={
                  decision.action === 'Approved'
                    ? 'flex-1 bg-green-600 text-white hover:bg-green-700'
                    : decision.action === 'Adopted'
                      ? 'flex-1 bg-blue-600 text-white hover:bg-blue-700'
                      : 'flex-1'
                }
                onClick={() => void confirmDecision()}
                disabled={deciding}
              >
                {deciding
                  ? decision.action === 'Approved'
                    ? 'Approving…'
                    : decision.action === 'Adopted'
                      ? 'Marking as adopted…'
                      : decision.action === 'Return'
                        ? 'Returning…'
                        : decision.action === 'Rejected'
                          ? 'Rejecting…'
                          : 'Cancelling…'
                  : decision.action === 'Approved'
                    ? 'Approve application'
                    : decision.action === 'Adopted'
                      ? waiverStatusOf(
                          applications.find((app) => app.id === decision.app.id) ?? decision.app,
                        ) === 'None'
                        ? 'Generate waiver & mark adopted'
                        : 'Mark as adopted'
                      : decision.action === 'Return'
                        ? 'Return pet'
                        : decision.action === 'Rejected'
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
        onClose={() => {
          setWaiverAppId(null);
          setPendingAdoption(null);
        }}
        applicationId={waiverAppId}
        applicantName={waiverApp?.applicantName}
        onGenerated={handleWaiverGenerated}
      />
    </div>
  );
};
