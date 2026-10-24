import type { Waiver } from '@/types';

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

/**
 * Proof-of-signature page appended to a signed waiver bundle. It records the
 * typed signature, signer account, timestamp, version, and issuing staff so a
 * printed copy remains self-contained even when signatures are collected
 * on-screen rather than on paper.
 */
export const WaiverSignatureCertificate = ({ waiver }: { waiver: Waiver }) => {
  const signature = waiver.snapshot.signature;
  const signatureName = waiver.signatureName ?? signature?.name;
  const signedAt = waiver.signedAt ?? signature?.signedAt;
  if (!signatureName || !signedAt) return null;

  const { application, shelter, templates } = waiver.snapshot;
  const signedByName = waiver.signedByName ?? signature?.signedByName ?? application.applicantName;

  return (
    <div className="mx-auto max-w-[800px] bg-white text-slate-900">
      <section className="waiver-page">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-extrabold uppercase leading-tight text-teal-800">
              Electronic Signature Certificate
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-600">
              Adoption waiver record · {shelter?.name ?? 'Shelter'}
            </p>
          </div>
          <span className="mt-1 shrink-0 rounded border border-teal-600 px-2 py-1 text-center text-[10px] font-extrabold uppercase leading-tight tracking-wide text-teal-700">
            Signed
            <br />
            Version {waiver.version}
          </span>
        </div>
        <div className="mb-4 mt-1 border-b-2 border-teal-800" />

        <div className="rounded-md border border-green-700/30 bg-green-50 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-green-800">
            Signature accepted
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-700">
            The adopter signed this waiver electronically after confirming that they had
            read, understood, and voluntarily agreed to the issued document.
          </p>
          {signature?.consentText ? (
            <p className="mt-2 border-t border-green-700/20 pt-2 text-[10px] italic leading-relaxed text-slate-600">
              Consent recorded: “{signature.consentText}”
            </p>
          ) : null}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-[11px]">
          <div>
            <dt className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
              Application
            </dt>
            <dd className="font-mono text-[10px]">{application.id}</dd>
          </div>
          <div>
            <dt className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
              Waiver version
            </dt>
            <dd className="font-semibold">Version {waiver.version}</dd>
          </div>
          <div>
            <dt className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
              Signer account
            </dt>
            <dd className="font-semibold">{signedByName}</dd>
          </div>
          <div>
            <dt className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
              Signed at
            </dt>
            <dd className="font-semibold">{formatDateTime(signedAt)}</dd>
          </div>
          <div>
            <dt className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
              Issued by
            </dt>
            <dd className="font-semibold">
              {waiver.generatedBy?.name ?? 'Shelter staff'} ·{' '}
              {formatDateTime(waiver.generatedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
              Contact on file
            </dt>
            <dd>{application.email}</dd>
          </div>
        </dl>

        <div className="mt-6 rounded-md border border-slate-300 bg-slate-50 p-4">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Adopter electronic signature
          </p>
          <p className="mt-2 font-[cursive] text-2xl text-slate-900">{signatureName}</p>
          <div className="mt-1 border-b border-slate-900" />
          <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-600">
            <span>Typed full legal name</span>
            <span>{formatDateTime(signedAt)}</span>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Documents covered by this signature
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[10.5px] text-slate-700">
            {templates.map((template) => (
              <li key={template.id}>
                {template.name} ({template.category})
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-5 text-[9.5px] leading-relaxed text-slate-500">
          This certificate was generated automatically when the signature was recorded. The
          waiver version above is locked and cannot be regenerated. Any changes to the
          shelter&apos;s reusable templates apply only to future waivers.
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-300 pt-2 text-[10px] text-slate-500">
          <span>Electronic signature certificate</span>
          <span>
            {[shelter?.name, `Version ${waiver.version}`, 'Page 1 of 1']
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>
      </section>
    </div>
  );
};
