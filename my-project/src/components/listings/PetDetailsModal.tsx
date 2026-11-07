import { Check, PawPrint, Pencil } from 'lucide-react';
import { useState } from 'react';
import { DetailsModal } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { PetStatusBadge, VisibilityBadge } from '@/components/ui/StatusBadge';
import { formatAge, formatDate } from '@/utils/formatters';
import { getDetailsCareFlags } from '@/helpers';
import type { Pet, Shelter } from '@/types';

export interface PetDetailsModalProps {
  pet: Pet | null;
  shelters: Shelter[];
  onClose: () => void;
  onEdit: (pet: Pet) => void;
}

export const PetDetailsModal = ({
  pet,
  shelters,
  onClose,
  onEdit,
}: PetDetailsModalProps) => {
  // Keep the last pet around while the modal animates out, otherwise closing
  // would unmount the dialog before its exit transition could play.
  const [lastPet, setLastPet] = useState<Pet | null>(pet);
  if (pet && pet !== lastPet) setLastPet(pet);
  const detailPet = pet ?? lastPet;

  if (!detailPet) return null;

  return (
    <DetailsModal
      open={Boolean(pet)}
      onClose={onClose}
      title={detailPet.name}
      description={`${detailPet.breed} · ${formatAge(detailPet.ageYears)}`}
      icon={PawPrint}
      footer={
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" size="lg" className="w-full" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={() => {
              onClose();
              onEdit(detailPet);
            }}
          >
            <Pencil className="size-4" /> Edit in slider
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <img
            src={detailPet.imageUrl}
            alt={detailPet.name}
            className="h-56 w-full rounded-lg border object-cover"
          />
          {detailPet.gallery.length > 1 && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {detailPet.gallery.map((src, i) => (
                <img
                  key={`${src}-${i}`}
                  src={src}
                  alt={`${detailPet.name} photo ${i + 1}`}
                  className="h-16 w-full rounded-lg border object-cover"
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <PetStatusBadge status={detailPet.status} />
          <VisibilityBadge visibility={detailPet.visibility} />
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">{detailPet.description}</p>

        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border p-2.5">
            <dt className="text-xs text-muted-foreground">Species</dt>
            <dd className="font-medium capitalize">{detailPet.species}</dd>
          </div>
          <div className="rounded-lg border p-2.5">
            <dt className="text-xs text-muted-foreground">Gender · Size</dt>
            <dd className="font-medium capitalize">
              {detailPet.gender} · {detailPet.size}
            </dd>
          </div>
          <div className="rounded-lg border p-2.5">
            <dt className="text-xs text-muted-foreground">Age group</dt>
            <dd className="font-medium capitalize">{detailPet.ageGroup.replace('-', ' / ')}</dd>
          </div>
          <div className="rounded-lg border p-2.5">
            <dt className="text-xs text-muted-foreground">Shelter</dt>
            <dd className="font-medium">
              {shelters.find((s) => s.id === detailPet.shelterId)?.name ?? '—'}
            </dd>
          </div>
          <div className="rounded-lg border p-2.5">
            <dt className="text-xs text-muted-foreground">Added</dt>
            <dd className="font-medium">{formatDate(detailPet.dateAdded)}</dd>
          </div>
          <div className="rounded-lg border p-2.5">
            <dt className="text-xs text-muted-foreground">Temperament</dt>
            <dd className="font-medium">{detailPet.temperament.join(', ')}</dd>
          </div>
        </dl>

        <div>
          <h3 className="text-sm font-semibold">Care flags</h3>
          {getDetailsCareFlags(detailPet).length > 0 ? (
            <div className="mt-1.5 grid grid-cols-2 gap-2 text-sm">
              {getDetailsCareFlags(detailPet).map((label) => (
                <p key={label} className="flex items-center gap-1.5 text-muted-foreground">
                  <Check className="size-4 shrink-0 text-green-600" />
                  {label}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-sm text-muted-foreground">No care flags confirmed yet.</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold">Medical history</h3>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
            {detailPet.medicalHistory.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Behavioral notes</h3>
          <p className="mt-1 text-sm text-muted-foreground">{detailPet.behavioralNotes}</p>
        </div>
      </div>
    </DetailsModal>
  );
};

