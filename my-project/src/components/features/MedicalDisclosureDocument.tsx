import type { Waiver } from '@/types';
import { capitalize, formatAge } from '@/utils/formatters';

/**
 * Print-ready MEDICAL DISCLOSURE & HEALTH HISTORY ACKNOWLEDGMENT — the
 * two-page medical addendum from the shelter's template, filled dynamically
 * from the waiver snapshot (patient pet + on-file medical history + shelter
 * clinic + adopter acknowledgment).
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

/** Preventive-care rows cross-checked against the pet's on-file history. */
const VACCINE_ROWS: { label: string; match: RegExp; nextDue: string }[] = [
  { label: 'Rabies / 1-Year / 3-Year', match: /rabies/i, nextDue: 'Due: per vet schedule' },
  { label: 'Core Booster (DHPP / FVRCP)', match: /dhpp|fvrcp|distemper|parvovirus|booster|bordetella/i, nextDue: 'Due: annual booster' },
  { label: 'Heartworm / FeLV / FIV Test', match: /heartworm|fe?lv|fiv|leukemia|immunodeficiency/i, nextDue: 'Annual re-test recommended' },
  { label: 'Fecal Floatation / Deworming', match: /fecal|deworm|parasit|flea|tick/i, nextDue: 'Panacur / Pyrantel per schedule' },
];

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="border-b border-slate-300 pb-1 text-[13px] font-extrabold uppercase tracking-wide text-slate-900">
    {children}
  </h2>
);

const Clause = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <div className="waiver-clause rounded-md border border-slate-200 px-3 py-1.5">
    <p className="text-[10.5px] leading-relaxed text-slate-800">
      <span className="mr-2 font-extrabold text-red-800">{n}.</span>
      <strong>{title}:</strong> {children}
    </p>
  </div>
);

const PageFooter = ({ page }: { page: string }) => (
  <div className="mt-4 flex items-center justify-between border-t border-slate-300 pt-2 text-[10px] text-slate-500">
    <span>Pet Medical Disclosure &amp; Health History Acknowledgment</span>
    <span>{page}</span>
  </div>
);

const SignatureLine = ({ label }: { label: string }) => (
  <div>
    <div className="border-b border-slate-900 pb-5" />
    <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
  </div>
);

export const MedicalDisclosureDocument = ({ waiver }: { waiver: Waiver }) => {
  const { application, pet, shelter } = waiver.snapshot;

  const species = SPECIES_LABEL[pet.species] ?? capitalize(pet.species);
  const sex = capitalize(pet.gender);
  const altered = pet.spayedNeutered ? 'Altered' : 'Intact — confirm with shelter';
  const age = formatAge(pet.ageYears);
  const microchip = pet.microchipped ? 'Yes — on file with shelter' : 'None recorded';
  const intakeDate = toMmDdYyyy(pet.dateAdded);

  const history = pet.medicalHistory.map((m) => m.trim()).filter(Boolean);
  const matchRecord = (re: RegExp): string | null =>
    history.find((m) => re.test(m)) ?? null;

  return (
    <div className="mx-auto max-w-[800px] bg-white text-slate-900">
      {/* ============================== PAGE 1 ============================== */}
      <section className="waiver-page">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-extrabold leading-tight text-red-800">
              MEDICAL DISCLOSURE &amp; HEALTH HISTORY ACKNOWLEDGMENT
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-600">
              Veterinary Record Audit, Diagnosed Conditions, and Treatment Protocols
            </p>
          </div>
          <span className="mt-1 shrink-0 rounded border border-red-700 px-2 py-1 text-center text-[10px] font-extrabold uppercase leading-tight tracking-wide text-red-800">
            Medical record •<br />Addendum
          </span>
        </div>
        <div className="mb-3 mt-1 border-b-2 border-red-800" />

        <div className="rounded-r-md border-l-4 border-red-800 bg-slate-50 px-3 py-1.5">
          <p className="text-[10.5px] leading-relaxed text-slate-700">
            <strong>Purpose of Document:</strong> This document serves as a complete disclosure of
            all known clinical evaluations, lab diagnostics, surgeries, and ongoing medications
            while in the care of the rescue. The adopter acknowledges review of these findings
            prior to transfer.
          </p>
        </div>

        <div className="mt-2 space-y-2">
          <SectionTitle>Section 1. Patient &amp; Custody Profile</SectionTitle>
          <table className="w-full border-collapse text-[10.5px]">
            <tbody>
              <tr>
                <td className="w-[18%] border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Animal Name
                </td>
                <td className="border border-slate-300 px-2 py-1 font-medium">{pet.name}</td>
                <td className="w-[18%] border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Shelter Intake ID
                </td>
                <td className="break-all border border-slate-300 px-2 py-1">{pet.id}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Species / Breed
                </td>
                <td className="border border-slate-300 px-2 py-1">
                  {species} • {pet.breed}
                </td>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Approx. Age &amp; Weight
                </td>
                <td className="border border-slate-300 px-2 py-1">{age} • Weight not recorded</td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Sex &amp; Altered Status
                </td>
                <td className="border border-slate-300 px-2 py-1">
                  {sex} • {altered}
                </td>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Microchip Number
                </td>
                <td className="border border-slate-300 px-2 py-1">{microchip}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Intake Date
                </td>
                <td className="border border-slate-300 px-2 py-1">{intakeDate}</td>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Primary Examining Vet
                </td>
                <td className="border border-slate-300 px-2 py-1">
                  On file — {shelter.name} partner clinic
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-2 space-y-1.5">
          <SectionTitle>Section 2. Diagnostic Testing &amp; Preventive Vaccinations</SectionTitle>
          <table className="w-full border-collapse text-[10.5px]">
            <thead>
              <tr className="bg-slate-100">
                {['Diagnostic / Vaccine', 'Administration Date', 'Result / Lot #', 'Next Due Date / Notes'].map(
                  (h) => (
                    <th
                      key={h}
                      className="border border-slate-300 px-2 py-1 text-left text-[9px] font-extrabold uppercase tracking-wide text-slate-600"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {VACCINE_ROWS.map((row) => {
                const record = matchRecord(row.match);
                return (
                  <tr key={row.label}>
                    <td className="border border-slate-300 px-2 py-1 font-semibold">{row.label}</td>
                    <td className="border border-slate-300 px-2 py-1">
                      {record ? 'On file — see records' : 'Not on file'}
                    </td>
                    <td className="border border-slate-300 px-2 py-1">
                      {record
                        ? /negative/i.test(record)
                          ? 'Negative (on file)'
                          : 'Administered (on file)'
                        : '—'}
                    </td>
                    <td className="border border-slate-300 px-2 py-1">
                      {record ? row.nextDue : 'Due — consult vet'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-2 space-y-1.5">
          <SectionTitle>Section 3. Disclosed Medical Conditions &amp; Ongoing Treatments</SectionTitle>
          <table className="w-full border-collapse text-[10.5px]">
            <thead>
              <tr className="bg-slate-100">
                {['Identified Condition', 'Classification', 'Treatment Administered', 'Adoptive Continuing Care Plan'].map(
                  (h) => (
                    <th
                      key={h}
                      className="border border-slate-300 px-2 py-1 text-left text-[9px] font-extrabold uppercase tracking-wide text-slate-600"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((record) => (
                  <tr key={record}>
                    <td className="border border-slate-300 px-2 py-1 font-semibold">{record}</td>
                    <td className="border border-slate-300 px-2 py-1">
                      <span className="font-bold text-teal-800">On file</span>
                    </td>
                    <td className="border border-slate-300 px-2 py-1">
                      See attached veterinary records
                    </td>
                    <td className="border border-slate-300 px-2 py-1">
                      Follow veterinarian guidance
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="border border-slate-300 px-2 py-1 text-slate-500">
                    No medical conditions disclosed in shelter records — routine preventive care
                    applies.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="rounded-r-md border-l-4 border-red-700 bg-red-50 px-3 py-1.5">
            <p className="text-[10.5px] leading-relaxed text-red-900">
              <strong>Notice on Incubation Periods:</strong> Pathogens such as bordetella (kennel
              cough), parvovirus, panleukopenia, Giardia, and dermatophytes (ringworm) may have
              incubation phases of 5 to 21 days without displaying clinical symptoms at physical
              examination.
            </p>
          </div>
        </div>

        <PageFooter page="Page 1 of 2" />
      </section>

      {/* ============================== PAGE 2 ============================== */}
      <section className="waiver-page">
        <div className="space-y-1.5">
          <SectionTitle>
            Section 4. Health Warranties, Limitation &amp; Veterinary Release
          </SectionTitle>
          <Clause n="1" title="No Health Guarantee or Extended Warranty">
            The rescue organization certifies that this animal has received customary rescue shelter
            care and veterinary review as recorded. However, the Organization makes no
            representation, warranty, or guarantee that this animal is free from latent, congenital,
            hereditary, or incubating diseases or conditions.
          </Clause>
          <Clause n="2" title="Assumption of Future Financial & Medical Responsibility">
            The Adopter voluntarily assumes total responsibility for all future veterinary
            evaluations, lab work, emergency surgeries, medications, and treatments required from
            the exact date and hour of physical handover.
          </Clause>
          <Clause n="3" title="Veterinary Post-Adoption Baseline Checkup">
            The Adopter agrees to present this animal to their private licensed veterinarian within
            seven (7) to fourteen (14) days of adoption to establish a patient-doctor relationship,
            reconcile medical histories, and verify booster schedules.
          </Clause>
          <Clause n="4" title="Pre-existing Condition Exclusion from Claims">
            The Adopter understands that the Organization will not reimburse, offset, or cover any
            private veterinary invoices, diagnostics, prescription charges, or specialist fees
            incurred after adoption, regardless of whether a diagnosed condition predates the
            adoption date.
          </Clause>
          <Clause n="5" title="Resident Pet Health Precautions">
            The Adopter acknowledges that introducing a newly adopted rescue pet into a home with
            existing pets entails communicable disease risks. Adopter certifies that all resident
            pets are fully immunized and agrees to maintain reasonable quarantine isolation during
            initial transition.
          </Clause>
        </div>

        <div className="mt-2 space-y-1.5">
          <SectionTitle>Section 5. Adopter Attestation &amp; Legal Signatures</SectionTitle>
          <div className="space-y-1.5">
            <div className="flex items-start gap-2 rounded-md bg-slate-100 px-3 py-1.5">
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[3px] border border-red-800 bg-white" />
              <p className="text-[10.5px] leading-relaxed text-slate-700">
                I confirm that I have received, reviewed, and had explained to me the complete
                medical records and disclosed conditions listed on Page 1 of this document.
              </p>
            </div>
            <div className="flex items-start gap-2 rounded-md bg-slate-100 px-3 py-1.5">
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[3px] border border-red-800 bg-white" />
              <p className="text-[10.5px] leading-relaxed text-slate-700">
                I accept the animal in its current physical and clinical condition
                (“as-is”) and agree to assume all future medical care and expenses without
                recourse.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-slate-300 bg-slate-50 p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-red-900">
                Adopter acknowledgment
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SignatureLine label="Adopter signature" />
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
                    Primary phone number
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-md border border-slate-300 bg-slate-50 p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-red-900">
                Shelter medical / adoption agent
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SignatureLine label="Authorized agent signature" />
                <SignatureLine label="Date (MM/DD/YYYY)" />
                <div>
                  <div className="border-b border-slate-900 pb-5" />
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Printed agent name &amp; title
                  </p>
                </div>
                <div>
                  <p className="truncate text-[11px] font-semibold">{shelter.name}</p>
                  <div className="border-b border-slate-900" />
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Clinic / shelter verification
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
