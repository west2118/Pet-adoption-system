import { useState } from 'react';
import { MessageCircleQuestion, Send } from 'lucide-react';
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

export const InquiryForm = ({ petName }: { petName: string }) => {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    setSent(true);
    toast.success(`Inquiry about ${petName} sent! The shelter will reply soon.`);
  };

  if (sent) {
    return (
      <Card>
        <CardContent className="pt-5 text-sm">
          <p className="font-semibold">Inquiry sent!</p>
          <p className="mt-1 text-muted-foreground">
            The shelter will reply about {petName} within 1–2 days. You will also
            get status updates under My Applications.
          </p>
        </CardContent>
      </Card>
    );
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
          <Button type="submit" className="w-full" size="sm">
            <Send className="size-3.5" /> Send inquiry
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
