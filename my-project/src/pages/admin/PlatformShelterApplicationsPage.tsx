import { Building2, Check, Clock, Eye, Inbox, Mail, MapPin, Phone, ShieldCheck, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  DetailsModal,
  SectionHeader,
  TableCard,
  TablePagination,
  TableSkeletonRows,
} from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Label, Textarea } from '@/components/ui/Form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { ApiError } from '@/lib/apiClient';
import { shelterApplicationService } from '@/services/shelterApplicationService';
import type { ShelterApplication } from '@/types';
import { formatDate } from '@/utils/formatters';

export const PlatformShelterApplicationsPage = () => {
  const [applications, setApplications] = useState<ShelterApplication[]>([]);
  const [totalApplications, setTotalApplications] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewing, setViewing] = useState<ShelterApplication | null>(null);
  const [approving, setApproving] = useState<ShelterApplication | null>(null);
  const [rejecting, setRejecting] = useState<ShelterApplication | null>(null);
  const [approveMessage, setApproveMessage] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await shelterApplicationService.listPaginated({ page, limit: pageSize });
      setApplications(res.items);
      setTotalApplications(res.total);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load applications.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    // Initial fetch and dependency-driven updates
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const openApprove = (app: ShelterApplication) => {
    setApproving(app);
    setApproveMessage(
      `Welcome to Paws&Homes! We are thrilled to partner with ${app.name}. Your shelter profile is now verified and active. You can now sign in to your dashboard to add listings and manage adoption applications.`,
    );
    setActionError(null);
  };

  const openReject = (app: ShelterApplication) => {
    setRejecting(app);
    setRejectNote(
      `Thank you for your interest in partnering with Paws&Homes. After reviewing the details provided for ${app.name}, we are unable to approve your application at this time. Please ensure all contact details, operating hours, and rescue documentation are fully complete.`,
    );
    setActionError(null);
  };

  const closeView = () => {
    setViewing(null);
  };

  const closeApprove = () => {
    setApproving(null);
    setApproveMessage('');
    setActionError(null);
  };

  const closeReject = () => {
    setRejecting(null);
    setRejectNote('');
    setActionError(null);
  };

  const handleApprove = async () => {
    if (!approving) return;
    setWorking(true);
    setActionError(null);
    try {
      const { emailSent, emailStubbed } = await shelterApplicationService.approve(
        approving.id,
        approveMessage.trim() || undefined,
      );
      if (emailSent) {
        toast.success(`${approving.name} approved! Notification email sent to ${approving.email}.`);
      } else if (emailStubbed) {
        toast.warning(
          `${approving.name} approved, but no email was delivered (email service not configured).`,
        );
      } else {
        toast.warning(`${approving.name} approved, but the notification email failed to send.`);
      }
      closeApprove();
      await load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to approve.';
      setActionError(message);
      toast.error(message);
    } finally {
      setWorking(false);
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    setWorking(true);
    setActionError(null);
    try {
      const { emailSent, emailStubbed } = await shelterApplicationService.reject(
        rejecting.id,
        rejectNote.trim() || undefined,
      );
      if (emailSent) {
        toast.success(`${rejecting.name} rejected. Notification email sent to ${rejecting.email}.`);
      } else if (emailStubbed) {
        toast.warning(
          `${rejecting.name} rejected, but no email was delivered (email service not configured).`,
        );
      } else {
        toast.warning(`${rejecting.name} rejected, but the notification email failed to send.`);
      }
      closeReject();
      await load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to reject.';
      setActionError(message);
      toast.error(message);
    } finally {
      setWorking(false);
    }
  };

  const handleResendEmail = async () => {
    if (!viewing) return;
    setWorking(true);
    setActionError(null);
    try {
      const { emailSent, emailStubbed } = await shelterApplicationService.resendEmail(
        viewing.id,
      );
      if (emailSent) {
        toast.success(`Notification email resent to ${viewing.email}.`);
      } else if (emailStubbed) {
        toast.warning('Email service not configured — no email was delivered.');
      } else {
        toast.warning('Resend attempted, but the email failed to send.');
      }
      setViewing((prev) =>
        prev ? { ...prev, emailSent, emailSentAt: emailSent ? new Date().toISOString() : prev.emailSentAt } : prev,
      );
      await load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to resend email.';
      setActionError(message);
      toast.error(message);
    } finally {
      setWorking(false);
    }
  };

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

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Shelter applications"
        subtitle="Review onboarding submissions. Approving creates the shelter and makes the registrant its owner."
        actions={
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <div className="mt-6">
        <TableCard
          title="Pending & reviewed"
          description="Newest submissions first."
          icon={Inbox}
          footer={pagination}
          isEmpty={!loading && applications.length === 0}
          emptyTitle="No shelter applications"
          emptyDescription="New shelter sign-ups will appear here for review."
          contentClassName="px-0"
        >
          {error ? (
            <p className="p-5 text-sm text-destructive">{error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shelter</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeletonRows rows={6} columns={6} avatar />
                ) : applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.name}</TableCell>
                    <TableCell>
                      <span className="block">{app.applicantName ?? '—'}</span>
                      <span className="text-xs text-muted-foreground">
                        {app.applicantEmail ?? app.email}
                      </span>
                    </TableCell>
                    <TableCell>{app.location}</TableCell>
                    <TableCell>{formatDate(app.submittedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <Badge
                          variant={
                            app.status === 'approved'
                              ? 'success'
                              : app.status === 'rejected'
                                ? 'destructive'
                                : 'warning'
                          }
                        >
                          {app.status}
                        </Badge>
                        {app.status !== 'pending' ? (
                          <span
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                            title={
                              app.emailSent
                                ? `Notification email delivered${app.emailSentAt ? ` on ${formatDate(app.emailSentAt)}` : ''}`
                                : 'Notification email was not delivered'
                            }
                          >
                            <Mail
                              className={`size-3 ${app.emailSent ? 'text-green-600' : 'text-destructive'}`}
                            />
                            {app.emailSent ? 'Email sent' : 'Email not sent'}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`View ${app.name} details`}
                          title="View details"
                          onClick={() => setViewing(app)}
                        >
                          <Eye className="size-4" />
                        </Button>

                        {app.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-950/40"
                              aria-label={`Approve ${app.name}`}
                              title="Approve & create shelter"
                              onClick={() => openApprove(app)}
                            >
                              <Check className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Reject ${app.name}`}
                              title="Reject shelter"
                              onClick={() => openReject(app)}
                            >
                              <X className="size-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableCard>
      </div>

      {/* Modal 1: Read-Only Application Details */}
      <DetailsModal
        open={viewing !== null}
        onClose={closeView}
        title={viewing?.name ?? 'Shelter application'}
        description={
          viewing ? `Submitted ${formatDate(viewing.submittedAt)}` : undefined
        }
        icon={Building2}
        footer={
          viewing && (
            <div className="flex flex-wrap items-center gap-3 w-full">
              <Badge
                variant={
                  viewing.status === 'approved'
                    ? 'success'
                    : viewing.status === 'rejected'
                      ? 'destructive'
                      : 'warning'
                }
              >
                {viewing.status}
              </Badge>
              {viewing.status !== 'pending' && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail
                    className={`size-3 ${viewing.emailSent ? 'text-green-600' : 'text-destructive'}`}
                  />
                  {viewing.emailSent
                    ? `Notification email sent${viewing.emailSentAt ? ` · ${formatDate(viewing.emailSentAt)}` : ''}`
                    : 'Notification email not delivered'}
                </span>
              )}
              {viewing.status !== 'pending' && !viewing.emailSent && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResendEmail}
                  disabled={working}
                  className="ml-auto"
                >
                  <Mail className="size-3.5" />
                  {working ? 'Sending…' : 'Resend email'}
                </Button>
              )}
              {viewing.status === 'pending' && (
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      const target = viewing;
                      closeView();
                      openReject(target);
                    }}
                  >
                    <X className="size-3.5" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const target = viewing;
                      closeView();
                      openApprove(target);
                    }}
                  >
                    <Check className="size-3.5" /> Approve &amp; create shelter
                  </Button>
                </div>
              )}
            </div>
          )
        }
      >
        {viewing && (
          <div className="space-y-4">
            {viewing.imageUrl && (
              <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
                <img
                  src={viewing.imageUrl}
                  alt={viewing.name}
                  className="aspect-video w-full object-cover max-h-48"
                />
              </div>
            )}
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Address
                  </dt>
                  <dd className="text-sm">
                    {viewing.address}, {viewing.location}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Operating hours
                  </dt>
                  <dd className="text-sm">{viewing.operatingHours}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Email
                  </dt>
                  <dd className="text-sm">{viewing.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Phone
                  </dt>
                  <dd className="text-sm">{viewing.phone}</dd>
                </div>
              </div>
            </dl>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                About the shelter
              </p>
              <p className="mt-1 text-sm leading-relaxed">{viewing.description}</p>
            </div>
          </div>
        )}
      </DetailsModal>

      {/* Modal 2: Dedicated Approve & Create Shelter Confirmation Modal */}
      <DetailsModal
        open={approving !== null}
        onClose={working ? () => undefined : closeApprove}
        title="Approve & create shelter?"
        description={approving ? `${approving.name} · ${approving.email}` : undefined}
        icon={ShieldCheck}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 w-full">
            <Button
              variant="outline"
              onClick={closeApprove}
              disabled={working}
              className="h-10 rounded-full px-5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={working}
              className="h-10 rounded-full px-5"
            >
              <Check className="size-4" />
              {working ? 'Creating shelter…' : 'Approve & create shelter'}
            </Button>
          </div>
        }
      >
        {approving && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Approving will activate <strong className="text-foreground">{approving.name}</strong> as a partner rescue on the platform. The approval notification email will be sent to <span className="font-medium text-foreground">{approving.email}</span>.
            </p>
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p>• Creates official shelter record visible on the public rescues directory.</p>
              <p>• Grants shelter portal access for managing listings and applications.</p>
            </div>
            <div>
              <Label htmlFor="approve-msg">Notification message to shelter (included in email)</Label>
              <Textarea
                id="approve-msg"
                value={approveMessage}
                onChange={(e) => setApproveMessage(e.target.value)}
                placeholder="Message sent to the shelter owner…"
                disabled={working}
                rows={4}
                className="mt-1.5"
              />
            </div>
            {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          </div>
        )}
      </DetailsModal>

      {/* Modal 3: Dedicated Reject Shelter Modal */}
      <DetailsModal
        open={rejecting !== null}
        onClose={working ? () => undefined : closeReject}
        title="Reject shelter application?"
        description={rejecting ? `${rejecting.name} · ${rejecting.email}` : undefined}
        icon={X}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 w-full">
            <Button
              variant="outline"
              onClick={closeReject}
              disabled={working}
              className="h-10 rounded-full px-5"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={working}
              className="h-10 rounded-full px-5"
            >
              <X className="size-4" />
              {working ? 'Rejecting…' : 'Confirm rejection'}
            </Button>
          </div>
        }
      >
        {rejecting && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Are you sure you want to decline the onboarding application for <strong className="text-foreground">{rejecting.name}</strong>? A rejection notification email will be sent to <span className="font-medium text-foreground">{rejecting.email}</span>.
            </p>
            <div>
              <Label htmlFor="reject-note">Notification message to shelter (included in email)</Label>
              <Textarea
                id="reject-note"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Share reasons or missing requirements with the applicant…"
                disabled={working}
                rows={4}
                className="mt-1.5"
              />
            </div>
            {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          </div>
        )}
      </DetailsModal>
    </div>
  );
};
