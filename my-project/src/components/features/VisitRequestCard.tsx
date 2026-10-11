import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Label } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';
import {
  ValidatedInput,
  ValidatedTextarea,
  focusFirstError,
  isBlank,
} from '@/components/shared';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/apiClient';
import { visitService } from '@/services/visitService';

/**
 * Formats a `datetime-local` value ("2026-10-18T10:00") into the readable
 * slot string stored on the thread ("Sat, Oct 18 at 10:00 AM").
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
 * Adopter entry point for visit scheduling: preferred slot + opening
 * message creates the (pet, adopter) thread the shelter team replies in.
 * Anonymous visitors are routed to login first.
 */
export const VisitRequestCard = ({ petId, petName }: { petId: string; petName: string }) => {
  const { user } = useAuth();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ slot: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  if (!user || user.role !== 'adopter') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="size-5 text-orange-500" />
            Visit {petName}
          </CardTitle>
          <CardDescription>Ask questions and coordinate a meet-and-greet.</CardDescription>
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
    const next: typeof fieldErrors = {};
    const picked = form.slot.trim() === '' ? null : new Date(form.slot);
    if (!picked || Number.isNaN(picked.getTime())) {
      next.slot = 'Pick a preferred date and time.';
    } else if (picked.getTime() <= Date.now()) {
      next.slot = 'Pick a date and time in the future.';
    }
    if (isBlank(form.message)) next.message = 'Please write a message.';
    else if (form.message.trim().length < 10)
      next.message = 'Message must be at least 10 characters.';
    setFieldErrors(next);
    if (Object.keys(next).length > 0 || !picked) {
      toast.warning('Please fix the highlighted fields.');
      focusFirstError();
      return;
    }
    setSending(true);
    try {
      await visitService.request({
        petId,
        preferredSlot: formatSlot(form.slot),
        message: form.message.trim(),
      });
      setSent(true);
      toast.success(`Visit request sent! The shelter will reply in your visits thread.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to send visit request.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Card>
        <CardContent className="pt-5 text-sm">
          <p className="font-semibold">Visit requested!</p>
          <p className="mt-1 text-muted-foreground">
            The shelter team will propose or confirm a time with {petName}.
          </p>
          <Link to="/visits">
            <Button size="sm" variant="outline" className="mt-3 w-full">
              Open my visits
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
        <CardDescription>Ask questions and coordinate a meet-and-greet.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <div>
            <Label htmlFor="visit-slot">Preferred date/time</Label>
            <ValidatedInput
              id="visit-slot"
              type="datetime-local"
              min={nowLocalInput()}
              value={form.slot}
              onChange={(e) => set('slot', e.target.value)}
              error={fieldErrors.slot}
            />
          </div>
          <div>
            <Label htmlFor="visit-msg">Message</Label>
            <ValidatedTextarea
              id="visit-msg"
              value={form.message}
              onChange={(e) => set('message', e.target.value)}
              placeholder={`Hi! I'd love to meet ${petName}…`}
              error={fieldErrors.message}
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
