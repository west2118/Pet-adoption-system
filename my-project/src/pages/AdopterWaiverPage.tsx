import { FileSignature, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { WaiverPrintDocument } from '@/components/features/WaiverPrintDocument';
import { Container } from '@/components/layout/Container';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import { waiverService } from '@/services/waiverService';
import type { Waiver } from '@/types';

const frame = 'mx-auto w-full max-w-[1400px] px-6 lg:px-12';

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/** Adopter view: preview the issued bundle and print it for signing at the shelter. */
export const AdopterWaiverPage = () => {
  const { id } = useParams<{ id: string }>();
  const [waiver, setWaiver] = useState<Waiver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      try {
        const data = await waiverService.getMyWaiver(id);
        if (mounted) setWaiver(data);
      } catch {
        if (mounted) setError('No waiver has been issued for this application yet.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <Container className="py-10">
        <p className="text-sm text-muted-foreground">Loading waiver…</p>
      </Container>
    );
  }

  if (error || !waiver) {
    return (
      <Container className="py-16">
        <EmptyState
          title="No waiver yet"
          description={error ?? 'The shelter has not issued a waiver for this application.'}
          action={
            <Link to="/applications">
              <Button size="sm">Back to applications</Button>
            </Link>
          }
        />
      </Container>
    );
  }

  const application = waiver.snapshot.application;

  return (
    <div className="landing-theme">
      <div className={frame}>
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 py-6">
          <Link
            to="/applications"
            className="font-mono text-xs uppercase tracking-[0.2em] text-primary hover:text-primary/75"
          >
            ← Back to applications
          </Link>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="size-4" /> Print waiver
          </Button>
        </div>

        <div className="print:hidden mb-6 overflow-hidden rounded-xl border bg-card">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/30 px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                <FileSignature className="size-5" />
              </span>
              <div>
                <h1 className="text-lg font-semibold">Adoption handover waiver</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {application.applicantName} · {waiver.snapshot.pet?.name ?? 'Adoption'} ·{' '}
                  {waiver.snapshot.shelter?.name ?? 'Shelter'}
                </p>
              </div>
            </div>
            <Badge variant="muted">Version {waiver.version}</Badge>
          </div>

          <div className="space-y-3 px-5 py-4 text-sm">
            <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <p>
                <span className="font-semibold text-foreground">Issued by:</span>{' '}
                {waiver.generatedBy?.name ?? 'Shelter staff'} ·{' '}
                {formatDateTime(waiver.generatedAt)}
              </p>
              <p>
                <span className="font-semibold text-foreground">Templates:</span>{' '}
                {waiver.snapshot.templates.map((template) => template.name).join(', ')}
              </p>
            </div>
          </div>
        </div>

        <div id="waiver-print" className="waiver-preview mb-10 rounded-lg">
          <WaiverPrintDocument waiver={waiver} />
        </div>
      </div>
    </div>
  );
};
