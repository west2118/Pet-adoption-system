import { ArrowRight, Clock, LogOut, MailCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { tokenStore } from '@/lib/apiClient';
import { authService } from '@/services/authService';
import type { ShelterApplication } from '@/types';

export const ShelterPendingPage = () => {
  const navigate = useNavigate();
  const [application, setApplication] = useState<ShelterApplication | null>(null);

  useEffect(() => {
    if (!tokenStore.getOnboarding()) {
      navigate('/signup', { replace: true });
      return;
    }
    authService.getMyShelterApplication().then(setApplication).catch(() => {});
  }, [navigate]);

  const handleLeave = () => {
    tokenStore.clearOnboarding();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center bg-background px-4 py-16">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-20 top-1/4 size-[36rem] rounded-full bg-[var(--brand)]/15 blur-[120px]" />
        <div className="absolute -left-20 bottom-10 size-[28rem] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <Container className="relative max-w-xl">
        <Card className="overflow-hidden rounded-2xl text-center md:rounded-[2rem]">
          <CardContent className="p-8 md:p-12">
            <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)]">
              <Clock className="size-8" />
            </span>

            <Badge variant="warning" className="mt-6">
              Pending approval
            </Badge>

            <h1 className="mt-4 text-[28px] font-normal tracking-tight">
              Your shelter is under review
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Thanks{application?.name ? `, ${application.name}` : ''}! We&apos;ve received
              your shelter details. Our team will review your application and email you as
              soon as your account is approved — you&apos;ll then be able to sign in.
            </p>

            <div className="mt-7 flex items-start gap-3 rounded-xl bg-muted/60 p-4 text-left">
              <MailCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-[13px] text-muted-foreground">
                Keep an eye on your inbox. Approval usually takes 1–2 business days. You
                can&apos;t sign in until then.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={handleLeave} className="h-11 rounded-full px-6 text-[15px]">
                <LogOut className="size-4" />
                Back to sign in
              </Button>
              <Link to="/pets">
                <Button variant="outline" className="h-11 w-full rounded-full px-6 text-[15px] sm:w-auto">
                  Browse pets
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
};
