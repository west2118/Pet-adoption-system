import { CalendarClock, Check, Eye, Flag, Mail, Trash2 } from 'lucide-react';

import { MobileRecordCard } from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/Checkbox';
import { VisitStatusBadge } from '@/components/ui/StatusBadge';
import type { VisitThread } from '@/types';
import { formatDate } from '@/utils/formatters';

export interface VisitMobileCardProps {
  thread: VisitThread;
  isWorking: boolean;
  selected: boolean;
  onSelectChange: () => void;
  onView: () => void;
  onEmail: () => void;
  onComplete: () => void;
  onDelete: () => void;
}

/** Small-screen card for one meet-and-greet request. */
export const VisitMobileCard = ({
  thread,
  isWorking,
  selected,
  onSelectChange,
  onView,
  onEmail,
  onComplete,
  onDelete,
}: VisitMobileCardProps) => {
  const canEmail = thread.status === 'requested' || thread.status === 'confirmed';
  const petName = thread.pet?.name ?? 'pet';

  return (
    <MobileRecordCard
      selection={
        <Checkbox
          checked={selected}
          onChange={onSelectChange}
          aria-label={`Select visit request for ${petName}`}
        />
      }
      media={
        thread.pet?.imageUrl ? (
          <img
            src={thread.pet.imageUrl}
            alt={thread.pet.name}
            className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-border/60"
          />
        ) : undefined
      }
      title={thread.pet?.name ?? 'Visit'}
      subtitle={thread.adopter?.name ?? 'Adopter'}
      status={<VisitStatusBadge status={thread.status} />}
      badges={
        <>
          <Badge variant="muted">
            <CalendarClock className="size-3" aria-hidden="true" /> {thread.preferredSlot}
          </Badge>
          {thread.confirmedSlot ? (
            <Badge variant="info">
              <Check className="size-3" aria-hidden="true" /> {thread.confirmedSlot}
            </Badge>
          ) : null}
        </>
      }
      meta={`Updated ${formatDate(thread.updatedAt)}`}
      actions={
        <>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground"
            aria-label={`View visit request for ${petName}`}
            onClick={onView}
          >
            <Eye className="size-4" />
          </Button>
          {canEmail ? (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/40"
              aria-label={`Email ${thread.adopter?.name ?? 'adopter'} about the visit`}
              onClick={onEmail}
            >
              <Mail className="size-4" />
            </Button>
          ) : null}
          {thread.status === 'confirmed' ? (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-950/40"
              aria-label={`Mark visit for ${petName} completed`}
              onClick={onComplete}
              disabled={isWorking}
            >
              <Flag className="size-4" />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Delete visit request for ${petName}`}
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
          </Button>
        </>
      }
    >
      {thread.reason?.trim() ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">{thread.reason}</p>
      ) : null}
    </MobileRecordCard>
  );
};
