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
import { ApplicationStatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/Feedback';

interface RecentApplicationsTableProps {
  applications: AdoptionApplication[];
  pets: Pet[];
}

export const RecentApplicationsTable = ({
  applications,
  pets,
}: RecentApplicationsTableProps) => {
  if (applications.length === 0) {
    return (
      <EmptyState
        title="No applications yet"
        description="Incoming adoption requests will appear here."
      />
    );
  }

  return (
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
        {applications.map((application) => {
          const pet = pets.find((p) => p.id === application.petId);
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
  );
};
