import { FileSignature, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { DetailsModal } from '@/components/shared';
import { WaiverPrintDocument } from './WaiverPrintDocument';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/apiClient';
import { waiverService } from '@/services/waiverService';
import type { Waiver, WaiverTemplate } from '@/types';

interface WaiverModalProps {
  open: boolean;
  onClose: () => void;
  applicationId: string | null;
  applicantName?: string;
}

/**
 * Card modal e-waiver: pick Active templates, generate the waiver bundle for
 * an Approved/Adopted application, preview it, and print — all without
 * leaving the applications page (no route navigation).
 *
 * Printing uses a dedicated `#waiver-print` copy portaled to `document.body`
 * so modal/sidebar overflow containers can't clip the document. The existing
 * `@media print` rules in `index.css` isolate it onto paper.
 */
export const WaiverModal = ({ open, onClose, applicationId, applicantName }: WaiverModalProps) => {
  const [templates, setTemplates] = useState<WaiverTemplate[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [waiver, setWaiver] = useState<Waiver | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State starts fresh on every open (the caller keys this modal by
  // application id), so the effect only performs the async load.
  useEffect(() => {
    if (!open || !applicationId) return;
    let mounted = true;
    (async () => {
      try {
        const all = await waiverService.listTemplates();
        if (!mounted) return;
        setTemplates(all);
        setSelected(all.filter((t) => t.status === 'Active').map((t) => t.id));
        try {
          const existing = await waiverService.getApplicationWaiver(applicationId);
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
  }, [open, applicationId]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const handleGenerate = async () => {
    if (!applicationId || selected.length === 0) {
      toast.warning('Select at least one template.');
      return;
    }
    setGenerating(true);
    try {
      const created = await waiverService.generateForApplication(applicationId, selected);
      setWaiver(created);
      toast.success('E-waiver generated!');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to generate waiver.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <DetailsModal
        open={open}
        onClose={generating ? () => undefined : onClose}
        title="E-waiver"
        description={
          applicantName ? `Handover documents for ${applicantName}.` : 'Handover documents.'
        }
        icon={FileSignature}
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={generating}
              className="sm:min-w-24"
            >
              Close
            </Button>
            {waiver ? (
              <Button
                type="button"
                size="sm"
                onClick={() => window.print()}
                className="sm:min-w-24"
              >
                <Printer className="size-3.5" /> Print waiver
              </Button>
            ) : null}
          </div>
        }
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading waiver…</p>
        ) : error ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground">
              Check your connection and try reopening this dialog.
            </p>
          </div>
        ) : !waiver ? (
          <div>
            <p className="text-sm text-muted-foreground">
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
            <Button
              className="mt-4 w-full"
              onClick={handleGenerate}
              disabled={generating || selected.length === 0}
            >
              {generating ? 'Generating…' : 'Generate & preview waiver'}
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-lg border bg-white p-6 print:hidden">
              <WaiverPrintDocument waiver={waiver} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground print:hidden">
              Tip: in the print dialog, set margins to Default and turn off “Headers and
              footers” for a clean 2-page PDF.
            </p>
          </>
        )}
      </DetailsModal>

      {/* Print-only copy outside every overflow container — hidden on screen,
          the sole `#waiver-print` the print stylesheet sends to paper. */}
      {open && waiver
        ? createPortal(
            <div id="waiver-print" className="hidden bg-white print:block">
              <WaiverPrintDocument waiver={waiver} />
            </div>,
            document.body,
          )
        : null}
    </>
  );
};
