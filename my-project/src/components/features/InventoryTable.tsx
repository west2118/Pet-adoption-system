import type { Pet } from '@/types';
import { formatDate } from '@/utils/formatters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { PetStatusBadge, VisibilityBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/Feedback';

interface InventoryTableProps {
  pets: Pet[];
}

export const InventoryTable = ({ pets }: InventoryTableProps) => {
  if (pets.length === 0) {
    return (
      <EmptyState
        title="No listings yet"
        description="Pets you add will show up in your inventory here."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pet</TableHead>
          <TableHead>Species</TableHead>
          <TableHead>Visibility</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Added</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pets.map((pet) => (
          <TableRow key={pet.id}>
            <TableCell>
              <div className="flex items-center gap-2.5">
                <img
                  src={pet.imageUrl}
                  alt={pet.name}
                  className="size-9 shrink-0 rounded-lg object-cover"
                />
                <p className="font-medium">{pet.name}</p>
              </div>
            </TableCell>
            <TableCell className="capitalize text-muted-foreground">{pet.species}</TableCell>
            <TableCell>
              <VisibilityBadge visibility={pet.visibility} />
            </TableCell>
            <TableCell>
              <PetStatusBadge status={pet.status} />
            </TableCell>
            <TableCell className="whitespace-nowrap text-right text-muted-foreground">
              {formatDate(pet.dateAdded)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
