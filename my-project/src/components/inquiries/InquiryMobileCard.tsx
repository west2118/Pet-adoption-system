import { Eye, Mail, PawPrint } from 'lucide-react';

import { MobileRecordCard } from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import type { Inquiry } from '@/services/api';
import type { Pet } from '@/types';
import { formatDate } from '@/utils/formatters';

import { InquiryStatusBadge } from './InquiryStatusBadge';

export interface InquiryMobileCardProps {
  inquiry: Inquiry;
  pet?: Pet;
  onView: () => void;
  onEmail: () => void;
}

/** Small-screen card for one adopter inquiry. */
export const InquiryMobileCard = ({
  inquiry,
  pet,
  onView,
  onEmail,
}: InquiryMobileCardProps) => (
  <MobileRecordCard
    media={
      pet ? (
        <img
          src={pet.imageUrl}
          alt={pet.name}
          className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-border/60"
        />
      ) : undefined
    }
    title={inquiry.fromName}
    subtitle={inquiry.fromEmail}
    status={<InquiryStatusBadge resolved={inquiry.resolved} />}
    badges={
      <>
        <Badge variant="muted">
          <PawPrint className="size-3" aria-hidden="true" /> {pet?.name ?? 'Unknown pet'}
        </Badge>
        {inquiry.emailedAt ? <Badge variant="info">Reply sent</Badge> : null}
      </>
    }
    meta={`Received ${formatDate(inquiry.createdAt)}`}
    actions={
      <>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground"
          aria-label={`View inquiry from ${inquiry.fromName}`}
          onClick={onView}
        >
          <Eye className="size-4" />
        </Button>
        {inquiry.emailedAt ? null : (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/40"
            aria-label={`Email ${inquiry.fromName}`}
            onClick={onEmail}
          >
            <Mail className="size-4" />
          </Button>
        )}
      </>
    }
  >
    <p className="line-clamp-2 text-sm text-muted-foreground">{inquiry.message}</p>
  </MobileRecordCard>
);
