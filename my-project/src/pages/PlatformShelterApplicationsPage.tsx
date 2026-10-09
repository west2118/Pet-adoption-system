import { Building2, Check, Clock, Inbox, Mail, MapPin, Phone, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { DetailsModal, SectionHeader, TableCard, TablePagination } from '@/components/shared';
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
  const [reviewing, setReviewing] = useState<ShelterApplication | null>(null);
  const [note, setNote] = useState('');
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
    load();
  }, [load]);

  const closeReview = () => {
    setReviewing(null);
    setNote('');
    setActionError(null);
  };

  const handleApprove = async () => {
    if (!reviewing) return;
    setWorking(true);
    setActionError(null);
    try {
      await shelterApplicationService.approve(reviewing.id);
      toast.success(`${reviewing.name} approved! Shelter account is now active.`);
      closeReview();
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
    if (!reviewing) return;
    setWorking(true);
    setActionError(null);
    try {
      await shelterApplicationService.reject(reviewing.id, note.trim() || undefined);
      toast.success(`${reviewing.name} application rejected.`);
      closeReview();
      await load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to reject.';
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
          {loading ? (
            <p className="p-5 text-sm text-muted-foreground">Loading applications…</p>
          ) : error ? (
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
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
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
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setReviewing(app)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableCard>
      </div>

      <DetailsModal
        open={reviewing !== null}
        onClose={closeReview}
        title={reviewing?.name ?? 'Shelter application'}
        description={
          reviewing ? `Submitted ${formatDate(reviewing.submittedAt)}` : undefined
        }
        icon={Building2}
        footer={
          reviewing?.status === 'pending' ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={working}
                className="h-10 rounded-full px-5 text-destructive"
              >
                <X className="size-4" /> Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={working}
                className="h-10 rounded-full px-5"
              >
                <Check className="size-4" /> Approve &amp; create shelter
              </Button>
            </div>
          ) : (
            <Badge variant={reviewing?.status === 'approved' ? 'success' : 'destructive'}>
              {reviewing?.status}
            </Badge>
          )
        }
      >
        {reviewing && (
          <div className="space-y-4">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Address
                  </dt>
                  <dd className="text-sm">
                    {reviewing.address}, {reviewing.location}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Operating hours
                  </dt>
                  <dd className="text-sm">{reviewing.operatingHours}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Email
                  </dt>
                  <dd className="text-sm">{reviewing.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Phone
                  </dt>
                  <dd className="text-sm">{reviewing.phone}</dd>
                </div>
              </div>
            </dl>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                About the shelter
              </p>
              <p className="mt-1 text-sm leading-relaxed">{reviewing.description}</p>
            </div>

            {reviewing.status === 'pending' && (
              <div>
                <Label htmlFor="review-note">Rejection note (optional)</Label>
                <Textarea
                  id="review-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Reason shared with the applicant if rejected…"
                />
              </div>
            )}

            {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          </div>
        )}
      </DetailsModal>
    </div>
  );
};
