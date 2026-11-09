import { Flag } from 'lucide-react';

import { DetailsModal } from '@/components/shared';
import { Button } from '@/components/ui/button';
import type { VisitThread } from '@/types';

export interface VisitCompleteModalProps {
  thread: VisitThread | null;
  isWorking: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/** Confirmation modal for marking a confirmed visit completed. */
export const VisitCompleteModal = ({
  thread,
  isWorking,
  onClose,
  onConfirm,
}: VisitCompleteModalProps) => (
  <DetailsModal
    open={thread !== null}
    onClose={onClose}
    title="Mark visit as completed?"
    description="Verify this meet-and-greet session has taken place."
    icon={Flag}
    size="md"
    footer={
      <div className="flex w-full items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose} disabled={isWorking}>
          Cancel
        </Button>
        <Button
          size="sm"
          className="bg-green-600 text-white hover:bg-green-700"
          onClick={onConfirm}
          disabled={isWorking}
        >
          {isWorking ? 'Updating…' : 'Yes, mark completed'}
        </Button>
      </div>
    }
  >
    {thread ? (
      <div className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Are you sure you want to mark the visit for{' '}
          <strong className="font-medium text-foreground">
            {thread.pet?.name ?? 'this pet'}
          </strong>{' '}
          with{' '}
          <strong className="font-medium text-foreground">
            {thread.adopter?.name ?? 'the adopter'}
          </strong>{' '}
          as completed?
        </p>
        <div className="space-y-1 rounded-lg bg-muted/60 p-3 text-xs">
          <div>
            <span className="text-muted-foreground">Confirmed slot:</span>{' '}
            <span className="font-medium text-foreground">
              {thread.confirmedSlot || thread.preferredSlot}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Adopter:</span>{' '}
            <span className="font-medium text-foreground">
              {thread.adopter?.name ?? '—'} ({thread.adopter?.email ?? '—'})
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          This will update the visit status to completed and conclude this scheduled visit.
        </p>
      </div>
    ) : null}
  </DetailsModal>
);
