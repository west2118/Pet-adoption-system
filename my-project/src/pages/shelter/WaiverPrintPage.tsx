import { FileSignature, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { WaiverDocument } from '@/components/features/WaiverDocument';
import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/apiClient';
import { waiverService } from '@/services/waiverService';
import type { Waiver, WaiverTemplate } from '@/types';

/**
 * Shelter handover view: pick Active templates, generate the waiver bundle
 * for an Approved/Adopted application, then print it for wet signatures.
 * Reprinting reuses the stored snapshot so template edits never rewrite history.
 */
export const WaiverPrintPage = () => {
  const { appId } = useParams<{ appId: string }>();
  const [waiver, setWaiver] = useState<Waiver | null>(null);
  const [templates, setTemplates] = useState<WaiverTemplate[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!appId) return;
      try {
        const all = await waiverService.listTemplates();
        if (!mounted) return;
        setTemplates(all);
        setSelected(all.filter((t) => t.status === 'Active').map((t) => t.id));
        try {
          const existing = await waiverService.getApplicationWaiver(appId);
          if (mounted) setWaiver(existing);
        } catch {
          // No waiver yet — staff picks templates below.
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to load waiver data.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [appId]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const handleGenerate = async () => {
    if (!appId || selected.length === 0) {
      toast.warning('Select at least one template.');
      return;
    }
    setGenerating(true);
    try {
      const created = await waiverService.generateForApplication(appId, selected);
      setWaiver(created);
      toast.success('E-waiver generated!');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to generate waiver.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-10">
        <p className="text-sm text-muted-foreground">Loading waiver…</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-16">
        <EmptyState
          title="Could not load waiver"
          description={error}
          action={
            <Link to="/shelter/applications">
              <Button size="sm">Back to applications</Button>
            </Link>
          }
        />
      </Container>
    );
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <div className="print:hidden mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/shelter/applications"
          className="font-mono text-xs uppercase tracking-[0.2em] text-primary hover:text-primary/75"
        >
          ← Back to applications
        </Link>
        {waiver && (
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="size-4" /> Print waiver
          </Button>
        )}
      </div>

      {!waiver ? (
        <div className="mx-auto max-w-2xl rounded-lg border bg-card p-6">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <FileSignature className="size-5" /> Generate e-waiver
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Select the templates to bundle into this adoption's waiver. Only Active
            templates are pre-selected.
          </p>
          <div className="mt-4 space-y-2">
            {templates.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(t.id)}
                  onChange={() => toggle(t.id)}
                  className="mt-1 size-4 accent-orange-600"
                />
                <span>
                  <span className="font-medium">{t.name}</span>{' '}
                  <span className="text-xs text-muted-foreground">
                    ({t.category} · {t.status})
                  </span>
                  <span className="mt-1 line-clamp-2 block text-muted-foreground">{t.body}</span>
                </span>
              </label>
            ))}
          </div>
          <Button className="mt-4 w-full" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating…' : 'Generate & preview waiver'}
          </Button>
        </div>
      ) : (
        <div id="waiver-print" className="rounded-lg border bg-white p-6 sm:p-10">
          <WaiverDocument waiver={waiver} />
        </div>
      )}
    </div>
  );
};
