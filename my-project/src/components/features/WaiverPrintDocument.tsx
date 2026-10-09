import type { Waiver } from '@/types';
import { FosterCareAgreementDocument } from './FosterCareAgreementDocument';
import { LiabilityWaiverDocument } from './LiabilityWaiverDocument';
import { MediaReleaseDocument } from './MediaReleaseDocument';
import { MedicalDisclosureDocument } from './MedicalDisclosureDocument';
import { TransportWaiverDocument } from './TransportWaiverDocument';

/**
 * Print dispatcher: renders the matching legal form for each bundled waiver
 * template category, so one printout covers the whole handover bundle.
 *
 * - Adoption (or an unrecognized bundle) → Pet Adoption Liability Waiver
 * - Foster → Foster Care Agreement & Volunteer Contract
 * - Medical → Medical Disclosure & Health History Acknowledgment
 * - Media → Photo, Media & Story Release Agreement
 * - Logistics → Rescue Animal Transport Agreement & Waiver
 * - General → appendix page with the exact template terms, so nothing the
 *   staff selected is silently dropped.
 */

/** Template categories covered by a dedicated legal form (not the appendix). */
const FORM_CATEGORIES = new Set(['Adoption', 'Foster', 'Medical', 'Media', 'Logistics']);

const AdditionalTermsPage = ({ waiver }: { waiver: Waiver }) => {
  const extra = waiver.snapshot.templates.filter((t) => !FORM_CATEGORIES.has(t.category));
  if (extra.length === 0) return null;
  return (
    <section className="waiver-page mx-auto max-w-[800px] bg-white text-slate-900">
      <h2 className="border-b border-slate-300 pb-1 text-[13px] font-extrabold uppercase tracking-wide text-slate-900">
        Appendix. Additional Terms &amp; Acknowledgments
      </h2>
      <p className="mt-1 text-[10.5px] text-slate-500">
        The following template terms were bundled into this waiver for application{' '}
        {waiver.snapshot.application.id}. The adopter acknowledges each of them alongside the
        legal form(s) above.
      </p>
      <div className="mt-2 space-y-1.5">
        {extra.map((t) => (
          <div key={t.id} className="waiver-clause rounded-md border border-slate-200 px-3 py-1.5">
            <p className="text-[11px] font-extrabold text-teal-800">{t.name}</p>
            <p className="mt-0.5 text-[10.5px] leading-relaxed text-slate-700">{t.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-300 pt-2 text-[10px] text-slate-500">
        <span>Pet Adoption E-Waiver · Appendix</span>
        <span>
          Issued for {waiver.snapshot.application.applicantName} · {waiver.snapshot.shelter.name}
        </span>
      </div>
    </section>
  );
};

export const WaiverPrintDocument = ({ waiver }: { waiver: Waiver }) => {
  const categories = new Set(waiver.snapshot.templates.map((t) => t.category));
  // Default to the liability form so a bundle without a recognized category
  // still prints a complete legal document (plus the appendix below).
  const showLiability = categories.has('Adoption') || categories.size === 0;
  const showFoster = categories.has('Foster');
  const showMedical = categories.has('Medical');
  const showMedia = categories.has('Media');
  const showTransport = categories.has('Logistics');
  const showForms = showLiability || showFoster || showMedical || showMedia || showTransport;

  return (
    <>
      {showLiability ? <LiabilityWaiverDocument waiver={waiver} /> : null}
      {showFoster ? <FosterCareAgreementDocument waiver={waiver} /> : null}
      {showMedical ? <MedicalDisclosureDocument waiver={waiver} /> : null}
      {showMedia ? <MediaReleaseDocument waiver={waiver} /> : null}
      {showTransport ? <TransportWaiverDocument waiver={waiver} /> : null}
      {!showForms ? <LiabilityWaiverDocument waiver={waiver} /> : null}
      <AdditionalTermsPage waiver={waiver} />
    </>
  );
};
