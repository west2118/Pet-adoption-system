import { useState } from 'react';
import { CheckCircle2, MessageCircleQuestion, Send } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Label } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';
import {
  ValidatedInput,
  ValidatedTextarea,
  focusFirstError,
  isBlank,
  isEmail,
} from '@/components/shared';
import { ApiError } from '@/lib/apiClient';
import { hasMyInquiryForPet, submitInquiry } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/Skeleton';

export const InquiryForm = ({ petId, petName }: { petId: string; petName: string }) => {
  const { user } = useAuth();
  return <InquiryFormContent key={`${petId}:${user?.id ?? 'guest'}`} petId={petId} petName={petName} />;
};

const InquiryFormContent = ({ petId, petName }: { petId: string; petName: string }) => {
  const { user } = useAuth();
  const isAdopter = user?.role === 'adopter';
  const queryClient = useQueryClient();
  const inquiryKey = ['my-inquiry', user?.id, petId];
  const inquiry = useQuery({
    queryKey: inquiryKey,
    queryFn: () => hasMyInquiryForPet(petId),
    enabled: isAdopter,
  });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: user?.name ?? '', email: isAdopter ? user.email : '', message: '' });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || sent || (isAdopter && inquiry.data)) return;
    const next: typeof fieldErrors = {};
    if (isBlank(form.name)) next.name = 'Please enter your name.';
    if (!isEmail(form.email)) next.email = 'Enter a valid email address.';
    if (isBlank(form.message)) next.message = 'Please write a message.';
    else if (form.message.trim().length < 10)
      next.message = 'Message must be at least 10 characters.';
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      toast.warning('Please fix the highlighted fields.');
      focusFirstError();
      return;
    }
    setSending(true);
    try {
      await submitInquiry({
        petId,
        fromName: form.name.trim(),
        fromEmail: form.email.trim(),
        message: form.message.trim(),
      });
      setForm({ name: '', email: '', message: '' });
      setFieldErrors({});
      setSent(true);
      if (isAdopter) queryClient.setQueryData(inquiryKey, true);
      toast.success(`Inquiry about ${petName} sent! The shelter will reply soon.`);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to send inquiry. Please try again.',
      );
    } finally {
      setSending(false);
    }
  };

  if (sent || (isAdopter && inquiry.data)) {
    return (
      <Card>
        <CardContent className="pt-5 text-sm" role="status">
          <p className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="size-4 text-green-600" /> Already inquired
          </p>
          <p className="mt-1 text-muted-foreground">
            You already sent an inquiry about {petName}. The shelter will reply by email.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isAdopter && inquiry.isPending) {
    return <Card><CardContent className="space-y-3 pt-5" role="status" aria-label="Checking your inquiry">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-full" />
    </CardContent></Card>;
  }

  if (isAdopter && inquiry.isError) {
    return <Card><CardContent className="pt-5 text-sm">
      <p>Could not check your inquiry. Please try again.</p>
      <Button className="mt-3" size="sm" variant="outline" onClick={() => void inquiry.refetch()}>Try again</Button>
    </CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircleQuestion className="size-5 text-orange-500" />
          Ask about {petName}
        </CardTitle>
        <CardDescription>Direct inquiry to the shelter.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <div>
            <Label htmlFor="inq-name">Your name</Label>
            <ValidatedInput
              id="inq-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Jane Doe"
              error={fieldErrors.name}
            />
          </div>
          <div>
            <Label htmlFor="inq-email">Email</Label>
            <ValidatedInput
              id="inq-email"
              type="email"
              readOnly={isAdopter}
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="jane@example.com"
              error={fieldErrors.email}
            />
          </div>
          <div>
            <Label htmlFor="inq-msg">Message</Label>
            <ValidatedTextarea
              id="inq-msg"
              value={form.message}
              onChange={(e) => set('message', e.target.value)}
              placeholder={`Hi! Is ${petName} still available? …`}
              error={fieldErrors.message}
            />
          </div>
          <Button type="submit" className="w-full" size="sm" disabled={sending}>
            <Send className="size-3.5" /> {sending ? 'Sending…' : 'Send inquiry'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
