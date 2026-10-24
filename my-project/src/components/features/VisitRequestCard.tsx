import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Label } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';
import { ValidatedInput, focusFirstError } from '@/components/shared';
import { VisitStatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/apiClient';
import { visitService } from '@/services/visitService';
import type { VisitThread } from '@/types';

/**
 * Formats a `datetime-local` value ("2026-10-18T10:00") into the readable
 * slot string stored on the request ("Sat, Oct 18 at 10:00 AM").
 */
const formatSlot = (value: string): string => {
  const d = new Date(value);
  const date = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${date} at ${time}`;
};

/** Current local time formatted for a `datetime-local` min attribute. */
const nowLocalInput = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Adopter entry point for visit requests: one request per pet, decided by
 * the shelter over email. Adopters who already requested this pet see their
 * request status plus a shortcut to My visits instead of the form.
 */
export const VisitRequestCard = ({ petId, petName }: { petId: string; petName: string }) => {
  const { user } = useAuth();
  const isAdopter = user?.role === 'adopter';
  const userId = user?.id;
  const [existing, setExisting] = useState<VisitThread | null | undefined>(undefined);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [slot, setSlot] = useState('');
  const [slotError, setSlotError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isAdopter || !userId) return;
    let active = true;
    visitService
      .getMineForPet(petId)
      .then((visit) => {
        if (active) setExisting(visit);
      })
      .catch(() => {
        if (active) setExisting(null);
      });
    return () => {
      active = false;
    };
  }, [isAdopter, petId, userId]);

  if (!user || !isAdopter) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="size-5 text-orange-500" />
            Visit {petName}
          </CardTitle>
          <CardDescription>Request a meet-and-greet with the shelter team.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sign in as an adopter to request a visit with {petName}.
          </p>
          <Link to="/login">
            <Button size="sm" className="mt-3 w-full">
              Sign in to request a visit
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const picked = slot.trim() === '' ? null : new Date(slot);
    if (!picked || Number.isNaN(picked.getTime())) {
      setSlotError('Pick a preferred date and time.');
      toast.warning('Please fix the highlighted fields.');
      focusFirstError();
      return;
    }
    if (picked.getTime() <= Date.now()) {
      setSlotError('Pick a date and time in the future.');
      toast.warning('Please fix the highlighted fields.');
      focusFirstError();
      return;
    }
    setSending(true);
    try {
      const thread = await visitService.request({
        petId,
        preferredSlot: formatSlot(slot),
      });
      setExisting(thread);
      setSent(true);
      toast.success('Visit request sent! The shelter will email you with their decision.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Another tab may have created the request first; show its state.
        const visit = await visitService.getMineForPet(petId).catch(() => null);
        setExisting(visit);
      }
      toast.error(err instanceof ApiError ? err.message : 'Failed to send visit request.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Card>
        <CardContent className="pt-5 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="size-4 text-green-600" />
            Visit requested!
          </p>
          <p className="mt-1 text-muted-foreground">
            The shelter team will review your request for {petName} and email you when they
            approve or decline it.
          </p>
          <Link to="/visits">
            <Button size="sm" variant="outline" className="mt-3 w-full">
              Go to My Visits
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (existing === undefined) {
    return (
      <Card>
        <CardContent className="pt-5 text-sm text-muted-foreground">
          Checking your visit request…
        </CardContent>
      </Card>
    );
  }

  if (existing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            <CalendarClock className="size-5 text-orange-500" />
            Visit already requested
            <VisitStatusBadge status={existing.status} />
          </CardTitle>
          <CardDescription>
            You already requested a visit with {petName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Only one visit request is allowed per pet. The shelter will email you when they
            approve or decline this request.
          </p>
          {existing.status === 'confirmed' && existing.confirmedSlot ? (
            <p className="mt-3 text-sm text-foreground">
              Approved for <strong>{existing.confirmedSlot}</strong>.
            </p>
          ) : existing.status === 'cancelled' ? (
            <p className="mt-3 text-sm text-muted-foreground">
              This request was cancelled or declined.
            </p>
          ) : (
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              Preferred {existing.preferredSlot}
            </p>
          )}
          <Link to="/visits">
            <Button size="sm" className="mt-4 w-full">
              Go to My Visits
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-5 text-orange-500" />
          Visit {petName}
        </CardTitle>
        <CardDescription>
          Request a meet-and-greet. The shelter will email you their decision.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <div>
            <Label htmlFor="visit-slot">Preferred date/time</Label>
            <ValidatedInput
              id="visit-slot"
              type="datetime-local"
              min={nowLocalInput()}
              value={slot}
              onChange={(e) => {
                setSlot(e.target.value);
                setSlotError(undefined);
              }}
              error={slotError}
            />
          </div>
          <Button type="submit" className="w-full" size="sm" disabled={sending}>
            <Send className="size-3.5" /> {sending ? 'Sending…' : 'Request visit'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
