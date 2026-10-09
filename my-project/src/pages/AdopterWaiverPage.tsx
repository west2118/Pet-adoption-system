import { Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { WaiverDocument } from '@/components/features/WaiverDocument';
import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import { waiverService } from '@/services/waiverService';
import type { Waiver } from '@/types';

const frame = 'mx-auto w-full max-w-[1400px] px-6 lg:px-12';

/** Adopter read-only view of the waiver issued for their adoption. */
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
        <div id="waiver-print" className="mb-10 rounded-lg border bg-white p-6 sm:p-10">
          <WaiverDocument waiver={waiver} />
        </div>
      </div>
    </div>
  );
};
