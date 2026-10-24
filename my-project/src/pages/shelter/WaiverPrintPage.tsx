import { AlertTriangle, FileSignature, Lock, Printer, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { WaiverPrintDocument } from '@/components/features/WaiverPrintDocument';
import { Container } from '@/components/layout/Container';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/apiClient';
import { formatWaiverBodyPreview } from '@/lib/waiverContent';
import {
  isSelectableTemplate,
  selectionHasLiability,
  selectableTemplateIds,
} from '@/lib/waiverSelection';
import { cn } from '@/lib/utils';
import { waiverService } from '@/services/waiverService';
import type { Waiver, WaiverTemplate } from '@/types';

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/**
 * Shelter handover view: pick Active templates, generate the waiver bundle
 * for an Approved/Adopted application, then print it. Issued bundles can be
 * regenerated (versioned) but signed bundles are locked.
 */
export const WaiverPrintPage = () => {
  const { appId } = useParams<{ appId: string }>();
  const [waiver, setWaiver] = useState<Waiver | null>(null);
  const [templates, setTemplates] = useState<WaiverTemplate[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplates, setEditingTemplates] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!appId) return;
      try {
        const all = await waiverService.listTemplates();
        if (!mounted) return;
        setTemplates(all);
        setSelected(selectableTemplateIds(all));
        try {
          const existing = await waiverService.getApplicationWaiver(appId);
          if (mounted) setWaiver(existing);
        } catch (err) {
          // 404 means no waiver yet — staff picks templates below.
          if (!(err instanceof ApiError) || err.status !== 404) throw err;
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

  const hasLiability = selectionHasLiability(templates, selected);
  const signed = waiver?.status === 'Signed';

  const toggle = (template: WaiverTemplate) => {
    if (!isSelectableTemplate(template)) return;
    setSelected((prev) =>
      prev.includes(template.id)
        ? prev.filter((id) => id !== template.id)
        : [...prev, template.id],
    );
  };

  const handleGenerate = async () => {
    if (!appId || selected.length === 0) {
      toast.warning('Select at least one template.');
      return;
    }
    if (!hasLiability) {
      toast.warning('Include a liability waiver (Adoption category) before generating.');
      return;
    }
    setGenerating(true);
    try {
      const created = await waiverService.generateForApplication(appId, selected);
      setWaiver(created);
      setEditingTemplates(false);
      toast.success(
        created.version > 1
          ? `E-waiver version ${created.version} generated.`
          : 'E-waiver generated!',
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to generate waiver.');
    } finally {
      setGenerating(false);
    }
  };

  const startEditingTemplates = () => {
    if (!waiver) return;
    const activeIds = new Set(templates.filter(isSelectableTemplate).map((template) => template.id));
    setSelected(waiver.snapshot.templates.map((template) => template.id).filter((id) => activeIds.has(id)));
    setEditingTemplates(true);
  };

  const templatePicker = (
    <div className="mt-4 space-y-2">
      {templates.map((template) => {
        const selectable = isSelectableTemplate(template);
        const checked = selected.includes(template.id);
        return (
          <label
            key={template.id}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3 text-sm',
              selectable ? 'cursor-pointer hover:bg-muted/50' : 'cursor-not-allowed opacity-65',
              checked && selectable && 'border-orange-500/50 bg-orange-50/40 dark:bg-orange-950/10',
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={!selectable}
              onChange={() => toggle(template)}
              className="mt-1 size-4 accent-orange-600"
            />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium">{template.name}</span>
                <Badge variant="muted">
                  {template.isDefault ? 'Platform default' : 'Your shelter only'}
                </Badge>
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {template.category}
                {template.isDefault ? '' : ' · private template'}
              </span>
              <span className="mt-1 line-clamp-2 block text-muted-foreground">
                {formatWaiverBodyPreview(template.body)}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );

  const liabilityNotice = !hasLiability ? (
    <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <p>
        A liability waiver is required. Select an <strong>Adoption</strong> template before
        generating the bundle.
      </p>
    </div>
  ) : null;

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
        {waiver && !editingTemplates && (
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
            Check the templates to bundle into this adoption&apos;s waiver — the preview below
            shows each checked template starting on its own printed page.
          </p>
          {templatePicker}
          {liabilityNotice}
          <Button
            className="mt-4 w-full"
            onClick={handleGenerate}
            disabled={generating || selected.length === 0 || !hasLiability}
          >
            {generating ? 'Generating…' : 'Generate & preview waiver'}
          </Button>
        </div>
      ) : editingTemplates ? (
        <div className="mx-auto max-w-2xl rounded-lg border bg-card p-6">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <FileSignature className="size-5" /> Change templates
          </h1>
          <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            Regenerating creates <strong>version {waiver.version + 1}</strong> and archives
            version {waiver.version}. The archived copy stays available to the shelter.
          </div>
          {templatePicker}
          {liabilityNotice}
          <Button
            className="mt-4 w-full"
            onClick={handleGenerate}
            disabled={generating || selected.length === 0 || !hasLiability}
          >
            {generating ? 'Generating…' : 'Regenerate & preview waiver'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setEditingTemplates(false)}
            disabled={generating}
          >
            Back to preview
          </Button>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="rounded-lg border bg-card p-4 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={signed ? 'success' : 'warning'}>
                  {signed ? 'Signed' : 'Issued · awaiting signature'}
                </Badge>
                <Badge variant="muted">Version {waiver.version}</Badge>
              </div>
              {signed ? null : (
                <Button variant="outline" size="sm" onClick={startEditingTemplates}>
                  Change templates
                </Button>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Previewing {waiver.snapshot.templates.length} template
              {waiver.snapshot.templates.length === 1 ? '' : 's'} · each starts on a new printed
              page
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Included: {waiver.snapshot.templates.map((template) => template.name).join(' · ')}
            </p>
            <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              <p>
                <span className="font-semibold text-foreground">Issued by:</span>{' '}
                {waiver.generatedBy?.name ?? 'Shelter staff'} ·{' '}
                {formatDateTime(waiver.generatedAt)}
              </p>
              {signed ? (
                <p>
                  <span className="font-semibold text-foreground">Signed:</span>{' '}
                  {waiver.signatureName ?? waiver.signedByName} ·{' '}
                  {formatDateTime(waiver.signedAt)}
                </p>
              ) : (
                <p className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" /> Liability (Adoption) template included.
                </p>
              )}
            </div>
            {signed ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
                <Lock className="size-3.5" /> Signed waivers are locked. Regeneration is disabled.
              </p>
            ) : null}
          </div>
          <div id="waiver-print" className="waiver-preview rounded-lg">
            <WaiverPrintDocument waiver={waiver} />
          </div>
        </div>
      )}
    </div>
  );
};
