import { AlertTriangle, FileSignature, History, Lock, Printer, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { DetailsModal } from '@/components/shared';
import { WaiverPrintDocument } from './WaiverPrintDocument';
import { Badge } from '@/components/ui/Badge';
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
import type { Waiver, WaiverTemplate, WaiverVersion } from '@/types';

interface WaiverModalProps {
  open: boolean;
  onClose: () => void;
  applicationId: string | null;
  applicantName?: string;
  /** Runs after a successful generation (used to finish a pending adoption). */
  onGenerated?: (waiver: Waiver) => void | Promise<void>;
  /** Lets the applications page refresh its waiver-status badges. */
  onWaiverChanged?: () => void;
}

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
 * Card modal e-waiver: pick Active templates, generate the waiver bundle for
 * an Approved/Adopted application, preview it, and print — all without
 * leaving the applications page (no route navigation).
 *
 * Issued waivers can be regenerated (the previous snapshot is archived as a
 * version), but signed waivers are immutable.
 */
export const WaiverModal = ({
  open,
  onClose,
  applicationId,
  applicantName,
  onGenerated,
  onWaiverChanged,
}: WaiverModalProps) => {
  const [templates, setTemplates] = useState<WaiverTemplate[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [waiver, setWaiver] = useState<Waiver | null>(null);
  const [versions, setVersions] = useState<WaiverVersion[] | null>(null);
  const [viewingVersion, setViewingVersion] = useState<WaiverVersion | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplates, setEditingTemplates] = useState(false);

  useEffect(() => {
    if (!open || !applicationId) return;
    let mounted = true;
    (async () => {
      try {
        const all = await waiverService.listTemplates();
        if (!mounted) return;
        setTemplates(all);
        setSelected(selectableTemplateIds(all));
        try {
          const existing = await waiverService.getApplicationWaiver(applicationId);
          if (mounted) setWaiver(existing);
        } catch (err) {
          // 404 means no waiver yet — staff picks templates below. Anything
          // else is a real loading failure and should surface.
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
  }, [open, applicationId]);

  const signed = waiver?.status === 'Signed';
  const hasLiability = selectionHasLiability(templates, selected);

  const toggle = (template: WaiverTemplate) => {
    if (!isSelectableTemplate(template)) return;
    setSelected((prev) =>
      prev.includes(template.id)
        ? prev.filter((id) => id !== template.id)
        : [...prev, template.id],
    );
  };

  const startEditingTemplates = () => {
    if (!waiver) return;
    const activeIds = new Set(templates.filter(isSelectableTemplate).map((template) => template.id));
    setSelected(waiver.snapshot.templates.map((template) => template.id).filter((id) => activeIds.has(id)));
    setViewingVersion(null);
    setEditingTemplates(true);
  };

  const loadVersions = async () => {
    if (!applicationId || versionsLoading) return;
    setVersionsLoading(true);
    try {
      const rows = await waiverService.listVersions(applicationId);
      setVersions(rows);
      setShowHistory(true);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Could not load the waiver version history.',
      );
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!applicationId || selected.length === 0) {
      toast.warning('Select at least one template.');
      return;
    }
    if (!hasLiability) {
      toast.warning('Include a liability waiver (Adoption category) before generating.');
      return;
    }

    setGenerating(true);
    try {
      const created = await waiverService.generateForApplication(applicationId, selected);
      setWaiver(created);
      setEditingTemplates(false);
      setViewingVersion(null);
      setVersions(null);
      setShowHistory(false);
      toast.success(
        created.version > 1
          ? `E-waiver version ${created.version} generated.`
          : 'E-waiver generated!',
      );
      onWaiverChanged?.();
      void onGenerated?.(created);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to generate waiver.');
    } finally {
      setGenerating(false);
    }
  };

  const displayWaiver: Waiver | null = viewingVersion && waiver
    ? {
        ...waiver,
        snapshot: viewingVersion.snapshot,
        status: viewingVersion.status === 'Signed' ? 'Signed' : 'Issued',
        version: viewingVersion.version,
        generatedAt: viewingVersion.generatedAt ?? waiver.generatedAt,
        generatedBy: viewingVersion.generatedBy,
        signedAt: viewingVersion.signedAt,
        signedByName: viewingVersion.signedByName,
        signatureName: viewingVersion.signatureName,
      }
    : waiver;
  const displaySigned = displayWaiver?.status === 'Signed';

  const templatePicker = (
    <div className="space-y-2">
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
                {template.isDefault ? (
                  <Badge variant="muted">Platform default</Badge>
                ) : (
                  <Badge variant="muted">Your shelter only</Badge>
                )}
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
        size="xl"
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
                disabled={editingTemplates || viewingVersion !== null}
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
              Select the templates to bundle into this adoption&apos;s waiver.
            </p>
            <div className="mt-4">{templatePicker}</div>
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
          <div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              Regenerating creates <strong>version {waiver.version + 1}</strong> and archives
              version {waiver.version}. The archived copy remains available in version history.
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Check the templates to bundle into this adoption&apos;s waiver.
            </p>
            <div className="mt-4">{templatePicker}</div>
            {liabilityNotice}
            <Button
              className="mt-4 w-full"
              onClick={handleGenerate}
              disabled={generating || selected.length === 0 || !hasLiability}
            >
              {generating ? 'Generating…' : 'Regenerate & preview waiver'}
            </Button>
            <Button
              type="button"
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
          <>
            <div className="rounded-lg border bg-muted/40 p-3 print:hidden">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={displaySigned ? 'success' : 'warning'}>
                    {displaySigned ? 'Signed' : 'Issued · awaiting signature'}
                  </Badge>
                  <Badge variant="muted">Version {displayWaiver?.version ?? waiver.version}</Badge>
                </div>
                {signed || viewingVersion ? null : (
                  <Button type="button" variant="outline" size="sm" onClick={startEditingTemplates}>
                    Change templates
                  </Button>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Previewing {displayWaiver?.snapshot.templates.length ?? 0} template
                {displayWaiver?.snapshot.templates.length === 1 ? '' : 's'} · each starts on a new
                printed page
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Included:{' '}
                {displayWaiver?.snapshot.templates.map((template) => template.name).join(' · ')}
              </p>
              <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                <p>
                  <span className="font-semibold text-foreground">Issued by:</span>{' '}
                  {displayWaiver?.generatedBy?.name ?? 'Shelter staff'} ·{' '}
                  {formatDateTime(displayWaiver?.generatedAt)}
                </p>
                {displaySigned ? (
                  <p>
                    <span className="font-semibold text-foreground">Signed:</span>{' '}
                    {displayWaiver?.signatureName ?? displayWaiver?.signedByName} ·{' '}
                    {formatDateTime(displayWaiver?.signedAt)}
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5" />
                    A liability (Adoption) template is included.
                  </p>
                )}
              </div>
              {displaySigned ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
                  <Lock className="size-3.5" /> Signed waivers are locked. Regeneration is
                  disabled.
                </p>
              ) : null}

              <div className="mt-3 border-t pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-1 py-1 text-xs"
                  onClick={() => {
                    if (showHistory) {
                      setShowHistory(false);
                    } else {
                      void loadVersions();
                    }
                  }}
                  disabled={versionsLoading}
                >
                  <History className="size-3.5" />
                  {showHistory ? 'Hide version history' : 'Version history'}
                  {versionsLoading ? ' (loading…)' : ''}
                </Button>
                {showHistory && versions ? (
                  <ul className="mt-2 space-y-1">
                    {versions.map((version) => (
                      <li key={version.id}>
                        <button
                          type="button"
                          onClick={() => setViewingVersion(version.isCurrent ? null : version)}
                          className={cn(
                            'flex w-full flex-wrap items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted/60',
                            version.isCurrent
                              ? 'border-green-600/30 bg-green-50/50 dark:bg-green-950/20'
                              : '',
                            viewingVersion?.id === version.id && 'ring-2 ring-orange-500/40',
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span className="font-semibold">Version {version.version}</span>
                            <Badge
                              variant={
                                version.isCurrent
                                  ? version.status === 'Signed'
                                    ? 'success'
                                    : 'info'
                                  : 'muted'
                              }
                            >
                              {version.isCurrent
                                ? version.status
                                : version.status === 'Signed'
                                  ? 'Superseded (signed)'
                                  : 'Superseded'}
                            </Badge>
                            {version.isCurrent ? (
                              <span className="text-muted-foreground">Current</span>
                            ) : (
                              <span className="text-muted-foreground">Archived</span>
                            )}
                          </span>
                          <span className="text-muted-foreground">
                            {formatDateTime(
                              version.isCurrent ? version.generatedAt : version.archivedAt,
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            {viewingVersion ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                <p>
                  Viewing archived version {viewingVersion.version}. It is read-only; printing
                  is disabled until you return to the current version.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setViewingVersion(null)}
                >
                  Back to current
                </Button>
              </div>
            ) : null}

            <div className="waiver-preview mt-3 print:hidden">
              {displayWaiver ? <WaiverPrintDocument waiver={displayWaiver} /> : null}
            </div>
            <p className="mt-3 text-xs text-muted-foreground print:hidden">
              PDF preview — each sheet below is exactly one printed page. Printing produces the
              same pages without these grey margins.
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
