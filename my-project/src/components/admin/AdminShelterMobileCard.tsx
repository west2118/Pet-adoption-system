import { Eye, Pencil, Trash2 } from 'lucide-react';

import { MobileRecordCard } from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import type { ShelterSummaryRow } from '@/services/api';

export interface AdminShelterMobileCardProps {
  row: ShelterSummaryRow;
  onView: (row: ShelterSummaryRow) => void;
  onEdit: (row: ShelterSummaryRow) => void;
  onDelete: (row: ShelterSummaryRow) => void;
}

export const AdminShelterMobileCard = ({
  row,
  onView,
  onEdit,
  onDelete,
}: AdminShelterMobileCardProps) => (
  <MobileRecordCard
    media={
      <img
        src={row.shelter.imageUrl}
        alt={row.shelter.name}
        className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-border/60"
      />
    }
    title={row.shelter.name}
    subtitle={row.shelter.location}
    status={
      <Badge variant={row.pendingApplications > 0 ? 'warning' : 'muted'}>
        {row.pendingApplications} pending
      </Badge>
    }
    badges={
      <>
        <Badge variant="muted">{row.petCount} pets</Badge>
        <Badge variant="info">{row.staff} staff</Badge>
      </>
    }
    meta={row.shelter.email}
    actions={
      <>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground"
          aria-label={`View ${row.shelter.name} details`}
          onClick={() => onView(row)}
        >
          <Eye className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
          aria-label={`Edit ${row.shelter.name}`}
          onClick={() => onEdit(row)}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
          aria-label={`Remove ${row.shelter.name}`}
          onClick={() => onDelete(row)}
        >
          <Trash2 className="size-4" />
        </Button>
      </>
    }
  />
);

