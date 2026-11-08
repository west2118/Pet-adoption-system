import { Mail, X } from 'lucide-react';

import { SlideOver, ValidatedInput, ValidatedTextarea } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Form';
import type { VisitThread } from '@/types';

export interface VisitEmailSlideOverProps {
  thread: VisitThread | null;
  slot: string;
  message: string;
  isSending: boolean;
  errors: Partial<Record<'slot' | 'message', string>>;
  onSlotChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onClose: () => void;
  onDecline: () => void;
  onSend: () => void;
}

/** Confirmation email with the visit date + message, like the inquiry reply. */
export const VisitEmailSlideOver = ({
  thread,
  slot,
  message,
  isSending,
  errors,
  onSlotChange,
  onMessageChange,
  onClose,
  onDecline,
  onSend,
}: VisitEmailSlideOverProps) => {
  const isConfirmed = thread?.status === 'confirmed';

  return (
    <SlideOver
      open={thread !== null}
      onClose={onClose}
      title={thread ? `Email ${thread.adopter?.name ?? 'the adopter'}` : 'Email adopter'}
      description={
        thread
          ? `${thread.pet?.name ?? 'Visit'} · ${thread.adopter?.email ?? 'no email on file'}`
          : undefined
      }
      icon={Mail}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="mr-auto text-destructive"
            onClick={onDecline}
            disabled={isSending}
          >
            <X className="size-3.5" />
            {isConfirmed ? 'Cancel visit' : 'Decline instead'}
          </Button>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSending}>
            Close
          </Button>
          <Button size="sm" onClick={onSend} disabled={isSending}>
            {isSending ? 'Sending…' : isConfirmed ? 'Send update' : 'Send & approve'}
          </Button>
        </div>
      }
    >
      {thread ? (
        <div className="space-y-4">
          <div className="rounded-lg border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">To</p>
            <p className="mt-1 text-sm font-medium">{thread.adopter?.name ?? 'Adopter'}</p>
            <p className="text-sm text-muted-foreground">
              {thread.adopter?.email ?? 'No email on file'}
            </p>
          </div>

          <div className="rounded-lg bg-muted/60 px-3 py-2">
            <p className="text-xs font-semibold">Their request</p>
            <p className="mt-0.5 text-sm">
              {thread.pet?.name ?? 'Pet'} · preferred {thread.preferredSlot}
            </p>
          </div>

          <div>
            <Label htmlFor="visit-email-slot">Visit date &amp; time</Label>
            <ValidatedInput
              id="visit-email-slot"
              value={slot}
              onChange={(e) => onSlotChange(e.target.value)}
              placeholder="e.g. Sat, Oct 18 at 10:00 AM"
              maxLength={255}
              error={errors.slot}
            />
          </div>

          <div>
            <Label htmlFor="visit-email-message">Message</Label>
            <ValidatedTextarea
              id="visit-email-message"
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder={`Where to meet and anything ${
                thread.adopter?.name ?? 'they'
              } should bring…`}
              className="min-h-40"
              maxLength={1000}
              error={errors.message}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Sending emails the adopter this date and message and{' '}
            {isConfirmed ? 'updates the confirmed schedule.' : 'approves the visit request.'}
          </p>
        </div>
      ) : null}
    </SlideOver>
  );
};
