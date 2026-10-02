import { useState } from 'react';
import { MessageCircleQuestion, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input, Textarea, Label } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';

export const InquiryForm = ({ petName }: { petName: string }) => {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSent(true);
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
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="inq-name">Your name</Label>
            <Input
              id="inq-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Doe"
              required
            />
          </div>
          <div>
            <Label htmlFor="inq-email">Email</Label>
            <Input
              id="inq-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jane@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="inq-msg">Message</Label>
            <Textarea
              id="inq-msg"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder={`Hi! Is ${petName} still available? …`}
              required
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
