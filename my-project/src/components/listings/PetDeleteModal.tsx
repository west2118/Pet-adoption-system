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
      description="Deleting this pet also permanently deletes all data connected to it: adoption applications and their status history, issued waivers and waiver versions, inquiries, visit requests, and adopter favorites."
      itemName={pet?.name}
      confirmLabel="Delete listing"
      isDeleting={isDeleting}
      requireNameConfirmation
    />
  );
};

