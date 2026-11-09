import { MessageCircleQuestion } from 'lucide-react';

import { DetailsModal } from '@/components/shared';
import type { Inquiry } from '@/services/api';
import type { Pet } from '@/types';
import { formatDate } from '@/utils/formatters';

import { InquiryStatusBadge } from './InquiryStatusBadge';

export interface InquiryDetailsModalProps {
  inquiry: Inquiry | null;
  pet?: Pet;
  onClose: () => void;
}

const InquiryDetails = ({ inquiry, pet }: { inquiry: Inquiry; pet?: Pet }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      {pet ? (
        <img src={pet.imageUrl} alt={pet.name} className="size-14 rounded-lg object-cover" />
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{pet?.name ?? 'Unknown pet'}</p>
        <p className="truncate text-xs text-muted-foreground">{pet?.breed ?? 'Pet inquiry'}</p>
      </div>
      <InquiryStatusBadge resolved={inquiry.resolved} />
    </div>

    <div className="rounded-lg border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">From</p>
      <p className="mt-1 text-sm font-medium">{inquiry.fromName}</p>
      <p className="text-sm text-muted-foreground">{inquiry.fromEmail}</p>
    </div>

    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Message</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{inquiry.message}</p>
    </div>

    {inquiry.emailedAt ? (
      <div className="rounded-lg border p-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Email sent</p>
        <p className="mt-1 text-sm font-medium">{inquiry.emailSubject ?? 'Reply'}</p>
        {inquiry.emailMessage ? (
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {inquiry.emailMessage}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">
          Sent to {inquiry.fromEmail} on {formatDate(inquiry.emailedAt)}
        </p>
      </div>
    ) : (
      <p className="text-xs text-muted-foreground">
        No email has been sent to this inquirer yet.
      </p>
    )}
  </div>
);

/** Read-only view of an inquiry and any reply already emailed to the adopter. */
export const InquiryDetailsModal = ({ inquiry, pet, onClose }: InquiryDetailsModalProps) => (
  <DetailsModal
    open={inquiry !== null}
    onClose={onClose}
    title={inquiry ? `Inquiry from ${inquiry.fromName}` : 'Inquiry'}
    description={inquiry ? `Received ${formatDate(inquiry.createdAt)}` : undefined}
    icon={MessageCircleQuestion}
  >
    {inquiry ? <InquiryDetails inquiry={inquiry} pet={pet} /> : null}
  </DetailsModal>
);
