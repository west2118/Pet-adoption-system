import type { AdoptionApplication, Pet } from '@/types';
import { formatDate } from '@/utils/formatters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { ApplicationStatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/Feedback';
import { MobileRecordCard, RecordCardSkeleton } from '@/components/shared';
import { TableSkeletonRows } from '@/components/shared/SkeletonLoaders';

interface RecentApplicationsTableProps {
  applications: AdoptionApplication[];
  pets: Pet[];
  /** Shows skeleton rows inside the table while the list loads or refreshes. */
  loading?: boolean;
}

export const RecentApplicationsTable = ({
  applications,
  pets,
  loading = false,
}: RecentApplicationsTableProps) => {
  if (!loading && applications.length === 0) {
    return (
      <div className="p-5 sm:p-6">
        <EmptyState
          title="No applications yet"
          description="Incoming adoption requests will appear here."
        />
      </div>
    );
  }

  return (
    <>
      {/* Desktop: data table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pet</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeletonRows columns={4} rows={4} avatar />
            ) : applications.map((application) => {
              const pet = pets.find((p) => p.id === application.petId) ?? application.pet;
              return (
                <TableRow key={application.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      {pet ? (
                        <img
                          src={pet.imageUrl}
                          alt={pet.name}
                          className="size-9 shrink-0 rounded-lg object-cover"
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
                    <p className="font-medium">{application.applicantName}</p>
                    <p className="truncate text-xs text-muted-foreground">{application.email}</p>
                  </TableCell>
                  <TableCell>
                    <ApplicationStatusBadge status={application.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right text-muted-foreground">
                    {formatDate(application.submittedAt)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked cards (read-only on the dashboard) */}
      <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
        {loading ? (
          <RecordCardSkeleton count={3} />
        ) : applications.map((application) => {
          const pet = pets.find((p) => p.id === application.petId) ?? application.pet;
          return (
            <MobileRecordCard
              key={application.id}
              media={
                pet ? (
                  <img
                    src={pet.imageUrl}
                    alt={pet.name}
                    className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-border/60"
                  />
                ) : undefined
              }
              title={pet?.name ?? '—'}
              subtitle={pet?.breed ?? 'Unknown breed'}
              status={<ApplicationStatusBadge status={application.status} />}
              badges={<Badge variant="muted">{application.applicantName}</Badge>}
              meta={`Submitted ${formatDate(application.submittedAt)}`}
            >
              <p className="truncate text-sm text-muted-foreground">{application.email}</p>
            </MobileRecordCard>
          );
        })}
      </div>
    </>
  );
};
