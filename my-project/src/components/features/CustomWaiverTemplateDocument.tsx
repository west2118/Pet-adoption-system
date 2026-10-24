import type { Waiver } from '@/types';
import { FormattedWaiverContent } from './WaiverContent';

interface CustomWaiverTemplate {
  name: string;
  category: string;
  body: string;
}

interface CustomWaiverTemplateDocumentProps {
  template: CustomWaiverTemplate;
  /** Issued waiver data; omit for a live editor preview. */
  waiver?: Waiver | null;
  /** Sample preview: never label the synthetic data as issued. */
  preview?: boolean;
}

const toDisplayDate = (iso: string | undefined): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const SignatureLine = ({ label }: { label: string }) => (
  <div>
    <div className="border-b border-slate-900 pb-5" />
    <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
  </div>
);

/**
 * Printable document for a shelter-authored template. Unlike the locked
 * platform defaults (which render dedicated legal forms), custom templates
 * render the shelter's own formatted wording so the preview, the generated
 * e-waiver, and the printed handover document always match what they wrote.
 */
export const CustomWaiverTemplateDocument = ({
  template,
  waiver,
  preview = false,
}: CustomWaiverTemplateDocumentProps) => {
  const application = waiver?.snapshot.application;
  const pet = waiver?.snapshot.pet;
  const shelter = waiver?.snapshot.shelter;
  const issued = toDisplayDate(waiver?.snapshot.issuedAt);

  return (
    <div className="mx-auto max-w-[800px] bg-white text-slate-900">
      <section className="waiver-page">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-extrabold uppercase leading-tight text-teal-800">
              {template.name}
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-600">
              {template.category} waiver
              {shelter ? ` · ${shelter.name}` : ''}
            </p>
          </div>
          <span className="mt-1 shrink-0 rounded border border-teal-600 px-2 py-1 text-center text-[10px] font-extrabold uppercase leading-tight tracking-wide text-teal-700">
            Shelter template
            <br />
            Custom form
          </span>
        </div>
        <div className="mb-3 mt-1 border-b-2 border-teal-800" />

        {application ? (
          <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[10.5px] sm:grid-cols-4">
            <div>
              <dt className="font-bold text-slate-500">Adopter</dt>
              <dd className="font-medium">{application.applicantName}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-500">Animal</dt>
              <dd className="font-medium">{pet?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-500">Shelter</dt>
              <dd className="font-medium">{shelter?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-500">{preview ? 'Preview' : 'Issued'}</dt>
              <dd className="font-medium">
                {preview ? 'Sample only' : issued || 'Not issued'}
              </dd>
            </div>
          </dl>
        ) : null}

        <FormattedWaiverContent body={template.body} />

        <div className="mt-5 space-y-2">
          <h2 className="border-b border-slate-300 pb-1 text-[13px] font-extrabold uppercase tracking-wide text-teal-800">
            Acknowledgment &amp; signatures
          </h2>
          <div className="rounded-md bg-slate-100 px-3 py-1.5">
            <p className="text-[10.5px] leading-relaxed text-slate-700">
              By signing below, the adopter confirms that they have read, understood, and
              voluntarily agree to every provision, acknowledgment, and condition stated in this
              document.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-300 bg-slate-50 p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-teal-800">
                Adopter execution
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SignatureLine label="Adopter signature" />
                <SignatureLine label="Date (MM/DD/YYYY)" />
                <div>
                  <p className="truncate text-[11px] font-semibold">
                    {application?.applicantName ?? 'Printed full legal name'}
                  </p>
                  <div className="border-b border-slate-900" />
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Printed full legal name
                  </p>
                </div>
                <SignatureLine label="ID / Driver's license #" />
              </div>
            </div>
            <div className="rounded-md border border-slate-300 bg-slate-50 p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-teal-800">
                Shelter / rescue representative
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SignatureLine label="Authorized representative signature" />
                <SignatureLine label="Date (MM/DD/YYYY)" />
                <div>
                  <div className="border-b border-slate-900 pb-5" />
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Printed agent name &amp; title
                  </p>
                </div>
                <div>
                  <p className="truncate text-[11px] font-semibold">{shelter?.name ?? 'Shelter'}</p>
                  <div className="border-b border-slate-900" />
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Organization seal / stamp
                  </p>
                </div>
              </div>
              {shelter ? (
                <p className="mt-2 text-[10px] text-slate-500">
                  {[shelter.address, shelter.phone, shelter.email].filter(Boolean).join(' · ')}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-300 pt-2 text-[10px] text-slate-500">
          <span>{template.name}</span>
          <span>
            {[shelter?.name, preview ? 'Sample preview' : issued ? `Issued ${issued}` : 'Sample preview']
              .filter(Boolean)
              .join(' · ')}{' '}
            · Page 1 of 1
          </span>
        </div>
      </section>
    </div>
  );
};
