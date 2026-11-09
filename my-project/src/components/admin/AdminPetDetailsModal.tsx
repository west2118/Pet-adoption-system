import { PawPrint } from 'lucide-react';

import { DetailsModal } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { PetStatusBadge, VisibilityBadge } from '@/components/ui/StatusBadge';
import type { Pet } from '@/types';
import { formatDate } from '@/utils/formatters';

export interface AdminPetDetailsModalProps {
  pet: Pet | null;
  shelterName: string;
  onClose: () => void;
}

export const AdminPetDetailsModal = ({
  pet,
  shelterName,
  onClose,
}: AdminPetDetailsModalProps) => (
  <DetailsModal
    open={pet !== null}
    onClose={onClose}
    title={pet?.name ?? 'Pet details'}
    description={pet ? `Posted by ${shelterName}` : undefined}
    icon={PawPrint}
    footer={
      <Button size="lg" variant="outline" className="w-full" onClick={onClose}>
        Close
      </Button>
    }
  >
    {pet && (
      <div className="space-y-4">
        <img
          src={pet.imageUrl}
          alt={pet.name}
          className="h-48 w-full rounded-lg border object-cover"
        />
        <div className="flex flex-wrap gap-1.5">
          <PetStatusBadge status={pet.status} />
          <VisibilityBadge visibility={pet.visibility} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{pet.description}</p>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border p-2.5">
            <dt className="text-xs text-muted-foreground">Shelter</dt>
            <dd className="font-medium">{shelterName}</dd>
          </div>
          <div className="rounded-lg border p-2.5">
            <dt className="text-xs text-muted-foreground">Species · Breed</dt>
            <dd className="font-medium capitalize">
              {pet.species} · {pet.breed}
            </dd>
          </div>
          <div className="rounded-lg border p-2.5">
            <dt className="text-xs text-muted-foreground">Age</dt>
            <dd className="font-medium">
              {pet.ageYears} y/o · {pet.ageGroup}
            </dd>
          </div>
          <div className="rounded-lg border p-2.5">
            <dt className="text-xs text-muted-foreground">Added</dt>
            <dd className="font-medium">{formatDate(pet.dateAdded)}</dd>
          </div>
        </dl>
      </div>
    )}
  </DetailsModal>
);

