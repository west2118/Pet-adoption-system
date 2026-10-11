import { useState } from 'react';
import type { ReactNode } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/Form';
import { VisitStatusBadge } from '@/components/ui/StatusBadge';
import type { VisitMessage, VisitThread } from '@/types';
import { formatDate } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface VisitThreadViewProps {
  thread: VisitThread;
  messages: VisitMessage[];
  currentUserId?: string;
  loadingMessages?: boolean;
  sending?: boolean;
  onSend: (body: string) => Promise<void>;
  /** Role-specific status buttons (cancel / propose / confirm / …). */
  actionBar?: ReactNode;
}

const isTerminal = (status: VisitThread['status']) =>
  status === 'completed' || status === 'cancelled';

/**
 * Shared visit-thread conversation: status header, slot summary, message
 * bubbles, and composer. Used by the adopter visits page and the shelter
 * visits inbox so both sides render the same thread.
 */
export const VisitThreadView = ({
  thread,
  messages,
  currentUserId,
  loadingMessages = false,
  sending = false,
  onSend,
  actionBar,
}: VisitThreadViewProps) => {
  const [draft, setDraft] = useState('');
  const closed = isTerminal(thread.status);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    await onSend(body);
    setDraft('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <VisitStatusBadge status={thread.status} />
        {thread.pet ? (
          <span className="text-sm text-muted-foreground">
            {thread.pet.name} · preferred {thread.preferredSlot}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">
            Preferred {thread.preferredSlot}
          </span>
        )}
      </div>

      {thread.confirmedSlot ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950/40 dark:text-green-300">
          Confirmed slot: {thread.confirmedSlot}
        </p>
      ) : null}
      {thread.status === 'cancelled' && thread.cancelReason ? (
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
          Cancellation note: {thread.cancelReason}
        </p>
      ) : null}

      {actionBar}

      <div className="space-y-2">
        {loadingMessages ? (
          <p className="text-sm text-muted-foreground">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          messages.map((m) => {
            const mine = currentUserId != null && m.senderId === currentUserId;
            return (
              <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                    mine ? 'bg-primary text-primary-foreground' : 'bg-muted/60',
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p
                    className={cn(
                      'mt-1 text-[11px]',
                      mine ? 'text-primary-foreground/70' : 'text-muted-foreground',
                    )}
                  >
                    {m.senderName ?? (mine ? 'You' : 'Shelter team')} · {formatDate(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {closed ? (
        <p className="rounded-lg border px-3 py-2 text-center text-xs text-muted-foreground">
          This visit thread is closed.
        </p>
      ) : (
        <div className="flex gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a message…"
            className="min-h-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
          <Button size="sm" onClick={() => void handleSend()} disabled={sending || !draft.trim()}>
            <Send className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};
