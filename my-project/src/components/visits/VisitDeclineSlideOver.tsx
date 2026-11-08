import { X } from 'lucide-react';

import { SlideOver, ValidatedTextarea } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Form';
import type { VisitThread } from '@/types';

export interface VisitDeclineSlideOverProps {
  thread: VisitThread | null;
  reason: string;
  isWorking: boolean;
  errors: Partial<Record<'reason', string>>;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

/** Decline / cancel a visit with a reason emailed to the adopter. */
export const VisitDeclineSlideOver = ({
  thread,
  reason,
  isWorking,
  errors,
  onReasonChange,
  onClose,
  onConfirm,
}: VisitDeclineSlideOverProps) => {
  const isConfirmed = thread?.status === 'confirmed';

  return (
    <SlideOver
      open={thread !== null}
      onClose={onClose}
      title={isConfirmed ? 'Cancel this visit?' : 'Decline this visit?'}
      description={
        thread
          ? `${thread.pet?.name ?? 'Visit'} · ${thread.adopter?.email ?? 'adopter'}`
          : undefined
      }
      icon={X}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isWorking}>
            Keep request
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isWorking}
          >
            {isWorking ? 'Working…' : isConfirmed ? 'Cancel visit' : 'Decline request'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          The adopter is emailed this decision. Their request keeps the cancelled status here.
        </p>
        <div>
          <Label htmlFor="visit-cancel-reason">Reason emailed to the adopter (optional)</Label>
          <ValidatedTextarea
            id="visit-cancel-reason"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Let the adopter know why…"
            maxLength={500}
            error={errors.reason}
          />
        </div>
      </div>
    </SlideOver>
  );
};
