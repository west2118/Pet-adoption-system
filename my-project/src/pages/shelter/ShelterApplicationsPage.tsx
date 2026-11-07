import { ClipboardList } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import {
  ApplicationActions,
  ApplicationDecisionModal,
  ApplicationDetailsModal,
  ApplicationMobileCard,
  WaiverStatusIndicator,
  waiverStatusOf,
} from '@/components/applications';
import type { DecisionAction, PendingDecision } from '@/components/applications';
import { WaiverModal } from '@/components/features/WaiverModal';
import {
  DebouncedSearchInput,
  RecordCardSkeleton,
  RefreshButton,
  SectionHeader,
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
import { Select } from '@/components/ui/Form';
import { ApplicationStatusBadge } from '@/components/ui/StatusBadge';
import { APPLICATION_STATUS_FILTER_OPTIONS } from '@/data/applicationPresets';
import { useAuth } from '@/hooks/useAuth';
import { usePets } from '@/hooks/useData';
import { adoptionApplicationService } from '@/services/adoptionApplicationService';
import { ApiError } from '@/lib/apiClient';
import type { AdoptionApplication, ApplicationStatus } from '@/types';
import { describeApiError } from '@/utils/errors';
import { formatDate } from '@/utils/formatters';

export const ShelterApplicationsPage = () => {
  const { pets } = usePets();
  const { user } = useAuth();

  // List state
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [totalApplications, setTotalApplications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialogs
  const [detailsApp, setDetailsApp] = useState<AdoptionApplication | null>(null);
  const [decision, setDecision] = useState<PendingDecision | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  // Pickup appointment collected before an application is approved.
  const [pickupAt, setPickupAt] = useState('');
  const [pickupEmail, setPickupEmail] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [waiverAppId, setWaiverAppId] = useState<string | null>(null);
  // When adoption is requested before a waiver exists, the waiver modal opens
  // first and this pending record completes the status change after issue.
  const [pendingAdoption, setPendingAdoption] = useState<{ id: string; note: string } | null>(null);
  // Opening details of a Submitted application moves it to Under Review once.
  const pendingReview = useRef<Set<string>>(new Set());

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setLoading(true);
      try {
        const res = await adoptionApplicationService.listForShelterPaginated({
          page,
          limit: pageSize,
          status: statusFilter,
          search: query.trim(),
        });
        setApplications(res.items);
        setTotalApplications(res.total);
        setLoadError(null);
      } catch (err) {
        setLoadError(describeApiError(err, 'Failed to load applications. Please try again.'));
      } finally {
        if (!options?.silent) setLoading(false);
      }
    },
    [page, pageSize, statusFilter, query],
  );

  useEffect(() => {
    // Initial load and filter/search changes; refresh owns the loading flag.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const waiverApp = waiverAppId
    ? (applications.find((app) => app.id === waiverAppId) ?? null)
    : null;

  /** Public pet record when still listed, otherwise the joined pet summary. */
  const petOf = (app: AdoptionApplication) => pets.find((p) => p.id === app.petId) ?? app.pet;

  const handleStatusChange = async (
    id: string,
    status: ApplicationStatus,
    note?: string,
    pickup?: { pickupAt: string; pickupEmail: string },
  ) => {
    try {
      // The backend owns the acceptance rule: it moves the pet and rejects the
      // competing applications in one transaction, then emails each applicant.
      // Re-read the list instead of duplicating that logic here.
      const updated = await adoptionApplicationService.updateStatus(
        id,
        status,
        note ?? 'Updated by staff',
        pickup,
      );
      setDetailsApp((prev) => (prev && prev.id === updated.id ? updated : prev));
      toast.success(`Application ${status.toLowerCase()}!`);
      await refresh({ silent: true });
      return true;
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : 'Failed to update application status. Please try again.',
      );
      return false;
    }
  };

  /**
   * Approve / reject / cancel adoption / complete the handover are decisions,
   * not one-click toggles — confirm them in a modal first (with an optional
   * note that is emailed).
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

  const resetDecision = () => {
    setDecision(null);
    setDecisionNote('');
    setPickupAt('');
    setPickupEmail('');
  };

  const confirmDecision = async () => {
    if (!decision) return;

    // Handover documents are mandatory. If none exist yet, open the waiver
    // builder first; `handleWaiverGenerated` finishes the adoption afterwards.
    const currentApp = applications.find((app) => app.id === decision.app.id) ?? decision.app;
    if (decision.action === 'Adopted' && waiverStatusOf(currentApp) === 'None') {
      const { id } = decision.app;
      const note = decisionNote.trim() || 'Adoption completed by shelter';
      resetDecision();
      setPendingAdoption({ id, note });
      setWaiverAppId(id);
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
    if (!ok) return;

    const adoptedId = decision.action === 'Adopted' ? decision.app.id : null;
    resetDecision();
    // Handover complete — open the e-waiver so staff can print the documents
    // immediately (no navigation).
    if (adoptedId) openWaiver(adoptedId);
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
  };

  /** Opening details marks a Submitted application as Under Review. */
  const openDetails = (app: AdoptionApplication) => {
    setDetailsApp(app);
    if (app.status !== 'Submitted' || pendingReview.current.has(app.id)) return;
    pendingReview.current.add(app.id);
    void handleStatusChange(app.id, 'Under Review', 'Application opened by shelter').finally(
      () => pendingReview.current.delete(app.id),
    );
  };

  const decisionApp =
    decision !== null
      ? (applications.find((app) => app.id === decision.app.id) ?? decision.app)
      : null;
  const decisionPet = decisionApp ? petOf(decisionApp) : undefined;

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Adoption applications"
        subtitle="Review incoming requests, approve or reject, and keep staff notes."
        actions={<RefreshButton onRefresh={() => refresh()} />}
      />

      <div className="mt-6 space-y-4">
        <TableCard
          title="Applications"
          description="Incoming adoption requests for your shelter's pets."
          icon={ClipboardList}
          toolbar={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <DebouncedSearchInput
                aria-label="Search applications"
                value={query}
                onDebouncedChange={(val) => {
                  setQuery(val);
                  setPage(1);
                }}
                placeholder="Search applicant or pet"
                className="sm:w-[240px]"
              />
              <Select
                aria-label="Filter by status"
                className="h-9 w-[180px]"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'all' | ApplicationStatus);
                  setPage(1);
                }}
                options={APPLICATION_STATUS_FILTER_OPTIONS}
              />
            </div>
          }
          error={loadError}
          errorTitle="Could not load applications"
          onRetry={() => void refresh()}
          isEmpty={!loading && applications.length === 0}
          emptyTitle="No applications found"
          emptyDescription="Try a different search or status filter."
          footer={
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
                ) : (
                  applications.map((app) => {
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
                            <ApplicationActions
                              app={app}
                              petName={pet?.name}
                              onView={openDetails}
                              onDecision={requestDecision}
                              onOpenWaiver={openWaiver}
                            />
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
            {loading ? (
              <RecordCardSkeleton count={3} />
            ) : (
              applications.map((app) => {
                const pet = petOf(app);
                return (
                  <ApplicationMobileCard
                    key={app.id}
                    app={app}
                    petName={pet?.name}
                    petImageUrl={pet?.imageUrl}
                    onView={openDetails}
                    onDecision={requestDecision}
                    onOpenWaiver={openWaiver}
                  />
                );
              })
            )}
          </div>
        </TableCard>
      </div>

      <ApplicationDetailsModal
        app={detailsApp}
        pet={detailsApp ? petOf(detailsApp) : null}
        onClose={() => setDetailsApp(null)}
        onDecision={requestDecision}
        onOpenWaiver={openWaiver}
      />

      <ApplicationDecisionModal
        decision={decision}
        petName={decisionPet?.name}
        waiverMissing={decisionApp !== null && waiverStatusOf(decisionApp) === 'None'}
        deciding={deciding}
        note={decisionNote}
        pickupAt={pickupAt}
        pickupEmail={pickupEmail}
        onNoteChange={setDecisionNote}
        onPickupAtChange={setPickupAt}
        onPickupEmailChange={setPickupEmail}
        onClose={resetDecision}
        onConfirm={() => void confirmDecision()}
      />

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
