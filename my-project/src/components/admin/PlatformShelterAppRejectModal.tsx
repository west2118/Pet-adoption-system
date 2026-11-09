import type { FormEvent } from 'react';
import { X } from 'lucide-react';

import { DetailsModal, ValidatedTextarea } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Form';
import type { ShelterApplication } from '@/types';

export interface PlatformShelterAppRejectModalProps {
  app: ShelterApplication | null;
  note: string;
  error?: string;
  isWorking: boolean;
  onClose: () => void;
  onChangeNote: (val: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export const PlatformShelterAppRejectModal = ({
  app,
  note,
  error,
  isWorking,
  onClose,
  onChangeNote,
  onSubmit,
}: PlatformShelterAppRejectModalProps) => (
  <DetailsModal
    open={app !== null}
    onClose={onClose}
    title={`Reject ${app?.name ?? 'Shelter'}`}
    description="Notify the applicant that their partnership request could not be accepted."
    icon={X}
    footer={
      <div className="flex w-full justify-end gap-2">
        <Button type="button" variant="outline" disabled={isWorking} onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={isWorking}
          onClick={onSubmit}
        >
          {isWorking ? 'Rejecting…' : 'Confirm Rejection'}
        </Button>
      </div>
    }
  >
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div>
        <Label htmlFor="reject-note">Reason for rejection *</Label>
        <ValidatedTextarea
          id="reject-note"
          rows={4}
          value={note}
          onChange={(e) => onChangeNote(e.target.value)}
          error={error}
          placeholder="Explain why the application was not approved so the applicant can reapply..."
        />
      </div>
    </form>
  </DetailsModal>
);

