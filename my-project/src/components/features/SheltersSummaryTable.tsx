import type { ShelterSummary } from '@/hooks/usePlatformOverview';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Feedback';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';

interface SheltersSummaryTableProps {
  shelters: ShelterSummary[];
}

export const SheltersSummaryTable = ({ shelters }: SheltersSummaryTableProps) => {
  if (shelters.length === 0) {
    return (
      <EmptyState
        title="No shelters yet"
        description="Registered partner shelters will appear here."
      />
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
        {shelters.map(({ shelter, petCount, publicPets, pendingApplications, staff }) => (
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
