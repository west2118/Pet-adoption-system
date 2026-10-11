import type { ShelterSummaryRow } from '@/services/api';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Feedback';
import { TableSkeletonRows } from '@/components/shared/SkeletonLoaders';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';

interface SheltersSummaryTableProps {
  shelters: ShelterSummaryRow[];
  /** Shows skeleton rows inside the table while the list loads or refreshes. */
  loading?: boolean;
}

export const SheltersSummaryTable = ({
  shelters,
  loading = false,
}: SheltersSummaryTableProps) => {
  if (!loading && shelters.length === 0) {
    return (
      <div className="p-5 sm:p-6">
        <EmptyState
          title="No shelters yet"
          description="Registered partner shelters will appear here."
        />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Shelter</TableHead>
          <TableHead>Listings</TableHead>
          <TableHead>Pending applications</TableHead>
          <TableHead className="text-right">Staff</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableSkeletonRows columns={4} rows={4} avatar />
        ) : shelters.map(({ shelter, petCount, publicPets, pendingApplications, staff }) => (
          <TableRow key={shelter.id}>
            <TableCell>
              <div className="flex items-center gap-2.5">
                <img
                  src={shelter.imageUrl}
                  alt={shelter.name}
                  className="size-9 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <p className="font-medium">{shelter.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {shelter.location}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <p className="font-medium">{petCount}</p>
              <p className="text-xs text-muted-foreground">{publicPets} public</p>
            </TableCell>
            <TableCell>
              {pendingApplications > 0 ? (
                <Badge variant="warning">{pendingApplications}</Badge>
              ) : (
                <span className="text-sm text-muted-foreground">None</span>
              )}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">{staff}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
