import { Eye } from 'lucide-react';

import { MobileRecordCard } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { PetStatusBadge, SpeciesBadge, VisibilityBadge } from '@/components/ui/StatusBadge';
import type { Pet } from '@/types';
import { formatDate } from '@/utils/formatters';

export interface AdminPetMobileCardProps {
  pet: Pet;
  shelterName: string;
  onView: (pet: Pet) => void;
}

export const AdminPetMobileCard = ({
  pet,
  shelterName,
  onView,
}: AdminPetMobileCardProps) => (
  <MobileRecordCard
    media={
      <img
        src={pet.imageUrl}
        alt={pet.name}
        className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-border/60"
      />
    }
    title={pet.name}
    subtitle={`${pet.breed} · ${shelterName}`}
    status={<PetStatusBadge status={pet.status} />}
    badges={
      <>
        <SpeciesBadge species={pet.species} />
        <VisibilityBadge visibility={pet.visibility} />
      </>
    }
    meta={`Added ${formatDate(pet.dateAdded)}`}
    actions={
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full text-muted-foreground"
        aria-label={`View ${pet.name} details`}
        onClick={() => onView(pet)}
      >
        <Eye className="size-4" />
      </Button>
    }
  />
);

