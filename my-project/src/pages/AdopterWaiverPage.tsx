import { CheckCircle2, FileSignature, LockKeyhole, Printer, ShieldCheck } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { WaiverPrintDocument } from '@/components/features/WaiverPrintDocument';
import { Container } from '@/components/layout/Container';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Feedback';
import { Input, Label } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/apiClient';
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

/** Adopter view: review the issued bundle, sign it, or print the signed copy. */
export const AdopterWaiverPage = () => {
  const { id } = useParams<{ id: string }>();
  const [waiver, setWaiver] = useState<Waiver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState('');
  const [consent, setConsent] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

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

  const handleSign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !waiver || signing) return;
    const trimmed = signatureName.trim();
    if (trimmed.length < 2) {
      setSignError('Type your full legal name to sign.');
      return;
    }
    if (!consent) {
      setSignError('Please confirm that you have read and agree to the waiver.');
      return;
    }

    setSigning(true);
    setSignError(null);
    try {
      const updated = await waiverService.signMyWaiver(id, {
        signatureName: trimmed,
        consent: true,
      });
      setWaiver(updated);
      setSignatureName('');
      setConsent(false);
      toast.success('Waiver signed. Your signed copy is ready to print.');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not record your signature. Please try again.';
      setSignError(message);
      toast.error(message);
    } finally {
      setSigning(false);
    }
  };

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

  const signed = waiver.status === 'Signed';
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
            <Printer className="size-4" /> {signed ? 'Print signed waiver' : 'Print waiver'}
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
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={signed ? 'success' : 'warning'}>
                {signed ? 'Signed' : 'Awaiting signature'}
              </Badge>
              <Badge variant="muted">Version {waiver.version}</Badge>
            </div>
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

            {signed ? (
              <div className="rounded-lg border border-green-600/30 bg-green-50 p-4 dark:bg-green-950/30">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-700 dark:text-green-400" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-green-900 dark:text-green-200">
                      Signed electronically
                    </p>
                    <p className="mt-0.5 text-sm text-green-800/80 dark:text-green-300/80">
                      {waiver.signatureName ?? waiver.signedByName} signed version {waiver.version}{' '}
                      on {formatDateTime(waiver.signedAt)}.
                    </p>
                    <p className="mt-2 font-[cursive] text-2xl text-green-950 dark:text-green-100">
                      {waiver.signatureName ?? waiver.signedByName}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-green-800/80 dark:text-green-300/80">
                      <LockKeyhole className="size-3.5" /> This version is locked. The shelter
                      cannot regenerate it.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSign}
                className="rounded-lg border border-amber-500/30 bg-amber-50/70 p-4 dark:bg-amber-950/20"
              >
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">Review and sign</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Read every page below. Signing records your typed name, timestamp, and
                      account, then locks this waiver version.
                    </p>

                    <div className="mt-4 max-w-md">
                      <Label htmlFor="waiver-signature-name">Full legal name</Label>
                      <Input
                        id="waiver-signature-name"
                        value={signatureName}
                        onChange={(event) => {
                          setSignatureName(event.target.value);
                          setSignError(null);
                        }}
                        placeholder="Type your full legal name"
                        autoComplete="name"
                        disabled={signing}
                        required
                        minLength={2}
                        maxLength={255}
                      />
                      {signatureName.trim() ? (
                        <p className="mt-2 font-[cursive] text-2xl text-slate-800 dark:text-slate-100">
                          {signatureName.trim()}
                        </p>
                      ) : null}
                    </div>

                    <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(event) => {
                          setConsent(event.target.checked);
                          setSignError(null);
                        }}
                        disabled={signing}
                        className="mt-1 size-4 shrink-0 accent-orange-600"
                      />
                      <span>
                        I have read, understood, and voluntarily agree to every provision in this
                        waiver. I understand that typing my name is my electronic signature.
                      </span>
                    </label>

                    {signError ? (
                      <p className="mt-3 text-sm text-destructive" role="alert">
                        {signError}
                      </p>
                    ) : null}

                    <Button
                      type="submit"
                      className="mt-4"
                      disabled={signing || !consent || signatureName.trim().length < 2}
                    >
                      {signing ? 'Signing…' : 'Sign & accept waiver'}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        <div id="waiver-print" className="waiver-preview mb-10 rounded-lg">
          <WaiverPrintDocument waiver={waiver} />
        </div>
      </div>
    </div>
  );
};
