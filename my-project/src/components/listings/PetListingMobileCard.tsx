import { Eye, Pencil, Trash2 } from 'lucide-react';

import { MobileRecordCard } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/Checkbox';
import { PetStatusBadge, SpeciesBadge, VisibilityBadge } from '@/components/ui/StatusBadge';
import type { Pet } from '@/types';
import { formatDate } from '@/utils/formatters';

export interface PetListingMobileCardProps {
  pet: Pet;
  selected: boolean;
  onSelectChange: () => void;
  onView: (pet: Pet) => void;
  onEdit: (pet: Pet) => void;
  onDelete: (pet: Pet) => void;
}

/**
 * Small-screen card for one shelter listing. Shows the photo, name and breed
 * with the status pinned to the corner, badges for the remaining details, and
 * the record actions in a dedicated footer so they are easy to tap.
 */
export const PetListingMobileCard = ({
  pet,
  selected,
  onSelectChange,
  onView,
  onEdit,
  onDelete,
}: PetListingMobileCardProps) => (
  <MobileRecordCard
    selection={
      <Checkbox
        checked={selected}
        onChange={onSelectChange}
        aria-label={`Select ${pet.name}`}
      />
    }
    media={
      <img
        src={pet.imageUrl}
        alt={pet.name}
        className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-border/60"
      />
    }
    title={pet.name}
    subtitle={pet.breed}
    status={<PetStatusBadge status={pet.status} />}
    badges={
      <>
        <SpeciesBadge species={pet.species} />
        <VisibilityBadge visibility={pet.visibility} />
      </>
    }
    meta={`Added ${formatDate(pet.dateAdded)}`}
    actions={
      <>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground"
          aria-label={`View ${pet.name} details`}
          onClick={() => onView(pet)}
        >
          <Eye className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
          aria-label={`Edit ${pet.name}`}
          onClick={() => onEdit(pet)}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
          aria-label={`Delete ${pet.name}`}
          onClick={() => onDelete(pet)}
        >
          <Trash2 className="size-4" />
        </Button>
      </>
    }
  />
);
