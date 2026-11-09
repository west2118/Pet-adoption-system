import { useQuery } from '@tanstack/react-query';
import { Building2, Check, Clock, Eye, X } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  PlatformShelterAppApproveModal,
  PlatformShelterAppDetailsModal,
  PlatformShelterAppMobileCard,
  PlatformShelterAppRejectModal,
} from '@/components/admin';
import {
  RefreshButton,
  SectionHeader,
  TableCard,
  TablePagination,
  TableSkeletonRows,
  focusFirstError,
} from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { useRefresh } from '@/hooks/useRefresh';
import {
  PLATFORM_SHELTER_APPLICATIONS_QUERY_KEY,
  usePlatformShelterApplicationMutations,
} from '@/hooks/usePlatformShelterApplicationMutations';
import { shelterApplicationReviewSchema, toFieldErrors } from '@/lib/validators';
import { shelterApplicationService } from '@/services/shelterApplicationService';
import type { ShelterApplication } from '@/types';
import { formatDate } from '@/utils/formatters';

export const PlatformShelterApplicationsPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewing, setViewing] = useState<ShelterApplication | null>(null);
  const [approving, setApproving] = useState<ShelterApplication | null>(null);
  const [rejecting, setRejecting] = useState<ShelterApplication | null>(null);
  const [approveMessage, setApproveMessage] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [reviewErrors, setReviewErrors] = useState<Record<string, string | undefined>>({});

  const {
    data: appsData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      ...PLATFORM_SHELTER_APPLICATIONS_QUERY_KEY,
      { page, limit: pageSize },
    ],
    queryFn: () => shelterApplicationService.listPaginated({ page, limit: pageSize }),
  });

  const { isRefreshing, refresh } = useRefresh(refetch);
  const showLoading = isLoading || isFetching || isRefreshing;

  const applications = appsData?.items ?? [];
  const totalApplications = appsData?.total ?? 0;

  const closeModals = () => {
    setApproving(null);
    setRejecting(null);
    setApproveMessage('');
    setRejectNote('');
    setReviewErrors({});
  };

  const {
    approveMutation,
    rejectMutation,
    resendEmailMutation,
    isWorking,
  } = usePlatformShelterApplicationMutations({
    onApproved: closeModals,
    onRejected: closeModals,
  });

  const handleOpenApprove = (app: ShelterApplication) => {
    setApproving(app);
    setApproveMessage(
      `Welcome to Paws&Homes! We are thrilled to partner with ${app.name}. Your shelter profile is now verified and active. You can now sign in to your dashboard to add listings and manage adoption applications.`,
    );
    setReviewErrors({});
  };

  const handleOpenReject = (app: ShelterApplication) => {
    setRejecting(app);
    setRejectNote(
      `Thank you for your interest in partnering with Paws&Homes. After reviewing the details provided for ${app.name}, we are unable to approve your application at this time. Please ensure all contact details, operating hours, and rescue documentation are fully complete.`,
    );
    setReviewErrors({});
  };

  const handleApproveSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!approving) return;

    const parsed = shelterApplicationReviewSchema.safeParse({ message: approveMessage });
    if (!parsed.success) {
      const fieldErrors = toFieldErrors(parsed.error.issues);
      setReviewErrors(fieldErrors);
      focusFirstError();
      return;
    }

    setReviewErrors({});
    approveMutation.mutate({
      id: approving.id,
      name: approving.name,
      message: approveMessage.trim() || undefined,
    });
  };

  const handleRejectSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!rejecting) return;

    const parsed = shelterApplicationReviewSchema.safeParse({ message: rejectNote });
    if (!parsed.success) {
      const fieldErrors = toFieldErrors(parsed.error.issues);
      setReviewErrors(fieldErrors);
      focusFirstError();
      return;
    }

    setReviewErrors({});
    rejectMutation.mutate({
      id: rejecting.id,
      name: rejecting.name,
      reviewNote: rejectNote.trim() || undefined,
    });
  };

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Shelter Partner Applications"
        subtitle="Review, approve, or reject new shelter partnership requests."
        actions={<RefreshButton onRefresh={refresh} />}
      />

      <div className="mt-6 space-y-4">
        <TableCard
          title="Applications"
          description="Pending and processed registration requests from shelters."
          icon={Building2}
          isEmpty={!showLoading && applications.length === 0}
          emptyTitle="No applications found"
          emptyDescription="When a shelter applies to join the platform, their submission will appear here."
          footer={
            totalApplications > 0 ? (
              <TablePagination
                currentPage={page}
                totalItems={totalApplications}
                pageSize={pageSize}
                onPageChange={(next) => setPage(next)}
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
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shelter Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showLoading ? (
                  <TableSkeletonRows columns={6} rows={6} />
                ) : (
                  applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="size-4 text-muted-foreground" />
                          <span>{app.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{app.applicantName || app.name}</div>
                          <div className="text-xs text-muted-foreground">{app.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{app.location}</div>
                          <div className="text-xs text-muted-foreground">{app.address}</div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(app.submittedAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            app.status === 'approved'
                              ? 'success'
                              : app.status === 'rejected'
                                ? 'destructive'
                                : 'warning'
                          }
                        >
                          {app.status === 'pending' ? (
                            <Clock className="mr-1 inline-block size-3" />
                          ) : null}
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="View details"
                            aria-label={`View ${app.name} details`}
                            onClick={() => setViewing(app)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          {app.status === 'pending' ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
                                title="Approve"
                                aria-label={`Approve ${app.name}`}
                                onClick={() => handleOpenApprove(app)}
                              >
                                <Check className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                title="Reject"
                                aria-label={`Reject ${app.name}`}
                                onClick={() => handleOpenReject(app)}
                              >
                                <X className="size-4" />
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile view */}
          <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
            {showLoading ? (
              <TableSkeletonRows columns={1} rows={4} />
            ) : (
              applications.map((app) => (
                <PlatformShelterAppMobileCard
                  key={app.id}
                  app={app}
                  onView={setViewing}
                  onApprove={handleOpenApprove}
                  onReject={handleOpenReject}
                />
              ))
            )}
          </div>
        </TableCard>
      </div>

      <PlatformShelterAppDetailsModal
        app={viewing}
        isWorking={isWorking}
        onClose={() => setViewing(null)}
        onApprove={(app) => {
          setViewing(null);
          handleOpenApprove(app);
        }}
        onReject={(app) => {
          setViewing(null);
          handleOpenReject(app);
        }}
        onResendEmail={(id) => resendEmailMutation.mutate({ id })}
      />

      <PlatformShelterAppApproveModal
        app={approving}
        message={approveMessage}
        error={reviewErrors.message}
        isWorking={isWorking}
        onClose={closeModals}
        onChangeMessage={(val) => {
          setApproveMessage(val);
          if (reviewErrors.message) setReviewErrors({});
        }}
        onSubmit={handleApproveSubmit}
      />

      <PlatformShelterAppRejectModal
        app={rejecting}
        note={rejectNote}
        error={reviewErrors.message}
        isWorking={isWorking}
        onClose={closeModals}
        onChangeNote={(val) => {
          setRejectNote(val);
          if (reviewErrors.message) setReviewErrors({});
        }}
        onSubmit={handleRejectSubmit}
      />
    </div>
  );
};
