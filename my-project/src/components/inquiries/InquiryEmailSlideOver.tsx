import { Mail } from 'lucide-react';

import { SlideOver, ValidatedInput, ValidatedTextarea } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Form';

import type { EmailDraft } from './types';

export interface InquiryEmailSlideOverProps {
  draft: EmailDraft | null;
  petName?: string;
  isSending: boolean;
  errors: Partial<Record<'subject' | 'message', string>>;
  onSubjectChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onClose: () => void;
  onSend: () => void;
}

/** Reply composer for an inquiry — sends once through the shelter's email. */
export const InquiryEmailSlideOver = ({
  draft,
  petName,
  isSending,
  errors,
  onSubjectChange,
  onMessageChange,
  onClose,
  onSend,
}: InquiryEmailSlideOverProps) => (
  <SlideOver
    open={draft !== null}
    onClose={onClose}
    title={draft ? `Email ${draft.inquiry.fromName}` : 'Email inquirer'}
    description={
      draft
        ? `Reply about ${petName ?? 'this pet'} · ${draft.inquiry.fromEmail}`
        : undefined
    }
    icon={Mail}
    footer={
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose} disabled={isSending}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={onSend}
          disabled={isSending}
        >
          {isSending ? 'Sending…' : 'Send email'}
        </Button>
      </div>
    }
  >
    {draft ? (
      <div className="space-y-4">
        <div className="rounded-lg border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">To</p>
          <p className="mt-1 text-sm font-medium">{draft.inquiry.fromName}</p>
          <p className="text-sm text-muted-foreground">{draft.inquiry.fromEmail}</p>
        </div>

        <div className="rounded-lg bg-muted/60 px-3 py-2">
          <p className="text-xs font-semibold">Their message</p>
          <p className="mt-0.5 whitespace-pre-line text-sm">{draft.inquiry.message}</p>
        </div>

        <div>
          <Label htmlFor="inquiry-email-subject">Subject</Label>
          <ValidatedInput
            id="inquiry-email-subject"
            value={draft.subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            maxLength={200}
            error={errors.subject}
          />
        </div>

        <div>
          <Label htmlFor="inquiry-email-message">Message</Label>
          <ValidatedTextarea
            id="inquiry-email-message"
            value={draft.message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder={`Write your reply to ${draft.inquiry.fromName}…`}
            className="min-h-40"
            maxLength={5000}
            error={errors.message}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          This sends once through the shelter's email. After it is delivered, the Email action
          is hidden.
        </p>
      </div>
    ) : null}
  </SlideOver>
);
