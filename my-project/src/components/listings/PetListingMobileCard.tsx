import { Eye, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PetStatusBadge, SpeciesBadge, VisibilityBadge } from '@/components/ui/StatusBadge';
import type { Pet } from '@/types';
import { formatDate } from '@/utils/formatters';

export interface PetListingMobileCardProps {
  pet: Pet;
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
  onView,
  onEdit,
  onDelete,
}: PetListingMobileCardProps) => {
  return (
    <article className="rounded-xl border bg-card p-3 shadow-xs transition-shadow focus-within:shadow-sm hover:shadow-sm">
      <div className="flex items-start gap-3">
        <img
          src={pet.imageUrl}
          alt={pet.name}
          className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-border/60"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold leading-tight">{pet.name}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{pet.breed}</p>
            </div>
            <PetStatusBadge status={pet.status} />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <SpeciesBadge species={pet.species} />
            <VisibilityBadge visibility={pet.visibility} />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
        <p className="text-xs text-muted-foreground">Added {formatDate(pet.dateAdded)}</p>

        <div className="flex items-center gap-1.5">
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
        </div>
      </div>
    </article>
  );
};
