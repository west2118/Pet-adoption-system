import { ConfirmDeleteModal } from '@/components/shared/ConfirmDeleteModal';
import type { Pet } from '@/types';

export interface PetDeleteModalProps {
  pet: Pet | null;
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: (petId: string) => void;
}

export const PetDeleteModal = ({
  pet,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}: PetDeleteModalProps) => {
  return (
    <ConfirmDeleteModal
      open={isOpen && pet !== null}
      onClose={() => {
        if (!isDeleting) onClose();
      }}
      onConfirm={() => {
        if (pet) onConfirm(pet.id);
      }}
      title="Delete pet listing?"
      description="This permanently removes the listing from your inventory."
      itemName={pet?.name}
      confirmLabel="Delete listing"
      isDeleting={isDeleting}
      requireNameConfirmation
    />
  );
};

