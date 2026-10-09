import type { Waiver } from '@/types';
import { capitalize, formatAge } from '@/utils/formatters';

/**
 * Print-ready FOSTER CARE AGREEMENT & VOLUNTEER CONTRACT — the two-page legal
 * form from the shelter's template, filled dynamically from the waiver
 * snapshot (foster caregiver application + animal + shelter + issue date).
 *
 * Rendered as two `.waiver-page` sections so the existing `@media print`
 * rules put exactly one form page on each sheet of paper.
 */

const SPECIES_LABEL: Record<string, string> = {
  dog: 'Canine',
  cat: 'Feline',
};

const toMmDdYyyy = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
};

const value = (v: string | undefined | null, fallback = 'Not recorded'): string => {
  const t = (v ?? '').trim();
  return t === '' ? fallback : t;
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="border-b border-slate-300 pb-1 text-[13px] font-extrabold uppercase tracking-wide text-slate-900">
    {children}
  </h2>
);

const Clause = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <div className="waiver-clause rounded-md border border-slate-200 px-3 py-1.5">
    <p className="text-[10.5px] leading-relaxed text-slate-800">
      <span className="mr-2 font-extrabold text-blue-800">{n}.</span>
      <strong>{title}:</strong> {children}
    </p>
  </div>
);

const PageFooter = ({ page }: { page: string }) => (
  <div className="mt-4 flex items-center justify-between border-t border-slate-300 pt-2 text-[10px] text-slate-500">
    <span>Foster Care Agreement &amp; Volunteer Caregiver Contract</span>
    <span>{page}</span>
  </div>
);

const SignatureLine = ({ label }: { label: string }) => (
  <div>
    <div className="border-b border-slate-900 pb-5" />
    <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
  </div>
);

export const FosterCareAgreementDocument = ({ waiver }: { waiver: Waiver }) => {
  const { application, pet, shelter, issuedAt } = waiver.snapshot;

  const species = SPECIES_LABEL[pet.species] ?? capitalize(pet.species);
  const sex = capitalize(pet.gender);
  const age = formatAge(pet.ageYears);
  const altered = pet.spayedNeutered ? 'Yes' : 'No — confirm with shelter';
  const placed = toMmDdYyyy(issuedAt);

  return (
    <div className="mx-auto max-w-[800px] bg-white text-slate-900">
      {/* ============================== PAGE 1 ============================== */}
      <section className="waiver-page">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-extrabold leading-tight text-blue-900">
              FOSTER CARE AGREEMENT &amp; VOLUNTEER CONTRACT
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-600">
              Temporary Custody, Care Guidelines, and Medical Authorization Protocol
            </p>
          </div>
          <span className="mt-1 shrink-0 rounded border border-blue-700 px-2 py-1 text-center text-[10px] font-extrabold uppercase leading-tight tracking-wide text-blue-800">
            Foster program •<br />Form FC-1
          </span>
        </div>
        <div className="mb-3 mt-1 border-b-2 border-blue-900" />

        <div className="rounded-r-md border-l-4 border-blue-800 bg-slate-50 px-3 py-1.5">
          <p className="text-[10.5px] leading-relaxed text-slate-700">
            <strong>Foster Parent Role &amp; Purpose:</strong> This Agreement establishes the terms
            under which a volunteer foster parent provides temporary shelter, sustenance,
            socialization, and compassionate care to an animal owned exclusively by the rescue
            organization awaiting permanent adoption.
          </p>
        </div>

        <div className="mt-2 space-y-2">
          <SectionTitle>Section 1. Foster Caregiver &amp; Animal Identification</SectionTitle>
          <table className="w-full border-collapse text-[10.5px]">
            <tbody>
              <tr>
                <td className="w-[18%] border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Foster Caregiver Name
                </td>
                <td className="border border-slate-300 px-2 py-1 font-medium">
                  {application.applicantName}
                </td>
                <td className="w-[18%] border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Shelter / Rescue Org
                </td>
                <td className="border border-slate-300 px-2 py-1 font-medium">{shelter.name}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Residence Address
                </td>
                <td colSpan={3} className="border border-slate-300 px-2 py-1">
                  {value(application.address)}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Primary Phone &amp; Email
                </td>
                <td className="border border-slate-300 px-2 py-1">{value(application.phone)}</td>
                <td colSpan={2} className="border border-slate-300 px-2 py-1">
                  {value(application.email)}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Foster Animal Name
                </td>
                <td className="border border-slate-300 px-2 py-1 font-medium">{pet.name}</td>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Animal Intake ID
                </td>
                <td className="break-all border border-slate-300 px-2 py-1">{pet.id}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Species / Breed / Color
                </td>
                <td colSpan={3} className="border border-slate-300 px-2 py-1">
                  {species} / {pet.breed} / Not recorded
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Age / Gender / Altered
                </td>
                <td className="border border-slate-300 px-2 py-1">
                  {age} • {sex} • Altered: {altered}
                </td>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Spay / Neuter Status
                </td>
                <td className="border border-slate-300 px-2 py-1">{altered}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Placement Start Date
                </td>
                <td className="border border-slate-300 px-2 py-1">{placed}</td>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Target Adoption Date
                </td>
                <td className="border border-slate-300 px-2 py-1">Open — to be scheduled</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[10px] text-slate-500">
            Foster placement for {pet.name} · Issued {placed} · Application {application.id}
          </p>
        </div>

        <div className="mt-2 space-y-1.5">
          <SectionTitle>
            Section 2. Ownership, Placement Terms &amp; Daily Care Standards
          </SectionTitle>
          <Clause n="1" title="Exclusive Property & Legal Title">
            The foster animal remains the sole, exclusive property of the Organization at all
            times. Foster Caregiver possesses no ownership rights, title, or lien upon the animal
            and may not sell, gift, trade, relocate, or re-home the animal under any
            circumstances.
          </Clause>
          <Clause n="2" title="Safe Housing & Containment">
            Foster Caregiver agrees to maintain the animal strictly indoors (or within fully
            enclosed, escape-proof yards under supervision). Dogs must remain leashed at all times
            when outdoors in public. Foster animals must never be fed outside, kept in open
            vehicles, or placed in off-leash dog parks.
          </Clause>
          <Clause n="3" title="Nutritional & Social Needs">
            Caregiver will provide appropriate food, fresh potable water, hygienic living quarters,
            regular exercise, humane positive-reinforcement socialization, and clean bedding daily
            in compliance with state animal welfare statutes.
          </Clause>
          <Clause n="4" title="Immediate Surrender on Demand">
            Caregiver agrees to return custody of the foster animal immediately upon oral or
            written request from the Organization for any reason, including veterinary
            appointments, adoption meetings, or program evaluation.
          </Clause>
          <div className="rounded-r-md border-l-4 border-green-700 bg-green-50 px-3 py-1.5">
            <p className="text-[10.5px] leading-relaxed text-green-900">
              <strong>Resident Pet Protocol:</strong> Rescue animals may have undocumented exposure
              to pathogens. Caregiver certifies that all personal resident pets are fully
              vaccinated, licensed, and altered, and agrees to conduct gradual quarantine
              introductions.
            </p>
          </div>
        </div>

        <PageFooter page="Page 1 of 2" />
      </section>

      {/* ============================== PAGE 2 ============================== */}
      <section className="waiver-page">
        <div className="space-y-1.5">
          <SectionTitle>
            Section 3. Veterinary Medical Authorization &amp; Emergency Protocols
          </SectionTitle>
          <Clause n="5" title="Approved Veterinary Care Only">
            All medical treatments, surgeries, diagnostic tests, and pharmaceuticals must receive
            prior authorization from the Organization and must be rendered by the
            Organization&apos;s designated partner veterinary clinics.
          </Clause>
          <Clause n="6" title="Unauthorized Expenses">
            If Foster Caregiver takes the animal to an unauthorized private veterinary hospital
            without express written or emergency approval from the Foster Coordinator, the
            Caregiver assumes full personal financial responsibility for all incurred costs.
          </Clause>
          <Clause n="7" title="Life-Threatening Emergencies">
            In critical medical emergencies, Caregiver must contact the Emergency Foster Hotline
            immediately. If authorized triage instructions cannot be obtained within reasonable
            time, emergency stabilization should be sought at the nearest 24-hour partner
            facility.
          </Clause>
        </div>

        <div className="mt-2 space-y-1.5">
          <SectionTitle>Section 4. Adoption Placement &amp; Liability Indemnification</SectionTitle>
          <Clause n="8" title="Foster-to-Adopt (“Foster Failing”)">
            If Caregiver desires to permanently adopt the foster animal, they must undergo the
            standard adoption application and approval process, pay applicable adoption fees, and
            execute a formal Adoption Agreement prior to final transfer.
          </Clause>
          <Clause n="9" title="Adoption Events & Meet-and-Greets">
            Caregiver agrees to make the animal available for prospective adopter visits, public
            adoption fairs, and photo updates arranged by the Organization.
          </Clause>
          <Clause n="10" title="Assumption of Risk & Hold Harmless">
            Foster Caregiver acknowledges that handling rescue animals involves inherent hazards,
            including bites, scratches, communicable zoonotic illnesses, or property destruction.
            Caregiver releases, defends, and indemnifies the Organization and its officers against
            all claims, injuries, or damages arising during the foster period.
          </Clause>
          <div className="rounded-r-md border-l-4 border-amber-600 bg-amber-50 px-3 py-1.5">
            <p className="text-[10.5px] leading-relaxed text-amber-900">
              <strong>Incident Reporting:</strong> Any bite that breaks human or animal skin,
              escape, injury, or critical illness must be reported to the Organization within two
              (2) hours of occurrence.
            </p>
          </div>
        </div>

        <div className="mt-2 space-y-1.5">
          <SectionTitle>Section 5. Agreement Execution &amp; Signatures</SectionTitle>
          <div className="flex items-start gap-2 rounded-md bg-slate-100 px-3 py-1.5">
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[3px] border border-blue-800 bg-white" />
            <p className="text-[10.5px] leading-relaxed text-slate-700">
              I certify that I am at least 21 years of age, reside at the premises above, have
              landlord/HOA consent to foster, and agree to abide strictly by all stipulations set
              forth in this Foster Care Agreement.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-slate-300 bg-slate-50 p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-blue-900">
                Foster caregiver
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SignatureLine label="Volunteer foster signature" />
                <SignatureLine label="Date (MM/DD/YYYY)" />
                <div>
                  <p className="truncate text-[11px] font-semibold">{application.applicantName}</p>
                  <div className="border-b border-slate-900" />
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Printed full legal name
                  </p>
                </div>
                <div>
                  <p className="truncate text-[11px] font-semibold">
                    {value(application.phone, '—')}
                  </p>
                  <div className="border-b border-slate-900" />
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Emergency contact phone
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-md border border-slate-300 bg-slate-50 p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-blue-900">
                Rescue coordinator / director
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SignatureLine label="Authorized representative signature" />
                <SignatureLine label="Date (MM/DD/YYYY)" />
                <div>
                  <div className="border-b border-slate-900 pb-5" />
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Printed representative name &amp; title
                  </p>
                </div>
                <div>
                  <p className="truncate text-[11px] font-semibold">{shelter.name}</p>
                  <div className="border-b border-slate-900" />
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Organization approval stamp
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-slate-500">
                {value(shelter.address)} · {value(shelter.phone)} · {value(shelter.email)}
              </p>
            </div>
          </div>
        </div>

        <PageFooter page="Page 2 of 2" />
      </section>
    </div>
  );
};
