import type { Waiver } from '@/types';
import { capitalize, formatAge } from '@/utils/formatters';

/**
 * Print-ready PET ADOPTION LIABILITY WAIVER & RELEASE — the two-page legal
 * form from the shelter's template, filled dynamically from the waiver
 * snapshot (adopter application + pet + shelter + issue date).
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
      <span className="mr-2 font-extrabold text-teal-700">{n}.</span>
      <strong>{title}:</strong> {children}
    </p>
  </div>
);

const PageFooter = ({ page }: { page: string }) => (
  <div className="mt-4 flex items-center justify-between border-t border-slate-300 pt-2 text-[10px] text-slate-500">
    <span>Pet Adoption Liability Waiver &amp; Release Agreement</span>
    <span>{page}</span>
  </div>
);

const SignatureLine = ({ label, wide = false }: { label: string; wide?: boolean }) => (
  <div className={wide ? 'col-span-2' : undefined}>
    <div className="border-b border-slate-900 pb-5" />
    <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
  </div>
);

export const LiabilityWaiverDocument = ({ waiver }: { waiver: Waiver }) => {
  const { application, pet, shelter, templates, issuedAt } = waiver.snapshot;

  const species = SPECIES_LABEL[pet.species] ?? capitalize(pet.species);
  const sex = capitalize(pet.gender);
  const age = formatAge(pet.ageYears);
  const microchip = pet.microchipped ? 'Yes — on file with shelter' : 'None recorded';
  const spayNeuter = pet.spayedNeutered
    ? 'Completed'
    : 'Not completed — confirm schedule with shelter';
  const medicalSummary =
    pet.medicalHistory.length > 0 ? pet.medicalHistory.join('; ') : 'No records on file';
  const bundledNames =
    templates.length > 0 ? templates.map((t) => t.name).join('; ') : 'Standard adoption terms';
  const issued = toMmDdYyyy(issuedAt);

  return (
    <div className="mx-auto max-w-[800px] bg-white text-slate-900">
      {/* ============================== PAGE 1 ============================== */}
      <section className="waiver-page">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-extrabold leading-tight text-teal-800">
              PET ADOPTION LIABILITY WAIVER &amp; RELEASE
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-600">
              Legally Binding Assumption of Risk, Hold Harmless, and Medical Agreement
            </p>
          </div>
          <span className="mt-1 shrink-0 rounded border border-teal-600 px-2 py-1 text-center text-[10px] font-extrabold uppercase leading-tight tracking-wide text-teal-700">
            Legal form •<br />Standard
          </span>
        </div>
        <div className="mb-3 mt-1 border-b-2 border-teal-800" />

        <div className="rounded-r-md border-l-4 border-teal-700 bg-slate-50 px-3 py-1.5">
          <p className="text-[10.5px] leading-relaxed text-slate-700">
            <strong>Notice to Adopter:</strong> Please read this entire document carefully prior
            to signing. By taking possession of the adopted animal, you acknowledge that you are
            assuming all legal, physical, behavioral, and financial responsibilities, and
            releasing the rescue organization from any future claims.
          </p>
        </div>

        <div className="mt-2 space-y-2">
          <SectionTitle>Section 1. Parties &amp; Animal Identification</SectionTitle>
          <table className="w-full border-collapse text-[10.5px]">
            <tbody>
              <tr>
                <td className="w-[18%] border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Adopter Full Name
                </td>
                <td className="border border-slate-300 px-2 py-1 font-medium">
                  {application.applicantName}
                </td>
                <td className="w-[18%] border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Adoption Organization
                </td>
                <td className="border border-slate-300 px-2 py-1 font-medium">{shelter.name}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Residential Address
                </td>
                <td colSpan={3} className="border border-slate-300 px-2 py-1">
                  {value(application.address)}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Contact Phone / Email
                </td>
                <td className="border border-slate-300 px-2 py-1">{value(application.phone)}</td>
                <td colSpan={2} className="border border-slate-300 px-2 py-1">
                  {value(application.email)}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Animal Name
                </td>
                <td className="border border-slate-300 px-2 py-1 font-medium">{pet.name}</td>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Breed / Mix
                </td>
                <td className="border border-slate-300 px-2 py-1">{pet.breed}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Species / Sex
                </td>
                <td className="border border-slate-300 px-2 py-1">
                  {species} • {sex}
                </td>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Approx. Age &amp; Color
                </td>
                <td className="border border-slate-300 px-2 py-1">
                  {age} • Not recorded
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Microchip ID
                </td>
                <td className="border border-slate-300 px-2 py-1">{microchip}</td>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Spay / Neuter Status
                </td>
                <td className="border border-slate-300 px-2 py-1">{spayNeuter}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[10px] text-slate-500">
            Bundled waivers: {bundledNames} · Issued {issued} · Application {application.id}
          </p>
        </div>

        <div className="mt-2 space-y-1.5">
          <SectionTitle>
            Section 2. Representations, Medical &amp; Behavior Acknowledgments
          </SectionTitle>
          <Clause n="1" title="“As-Is” Placement & Unpredictability">
            Adopter understands that animals are sentient, living creatures whose past history,
            health conditions, genetics, and environment can cause unpredictable behaviors. The
            Organization makes no guarantees, warranties, or promises regarding temperament,
            training, habits, physical health, or future behavior.
          </Clause>
          <Clause n="2" title="Full Medical Disclosure Received">
            Adopter acknowledges receipt of all known medical records, vaccination dates,
            diagnostic screenings, and veterinary history in the Organization&apos;s possession.
            Adopter accepts that rescue animals may harbor latent, asymptomatic, or incubating
            infections (including but not limited to kennel cough, giardia, parvo, or ringworm)
            not detectable at adoption. On-file records for {pet.name}: {medicalSummary}.
          </Clause>
          <Clause n="3" title="Immediate Veterinary Examination">
            Adopter agrees to present the adopted pet to a licensed veterinarian within seven (7)
            business days of adoption for a baseline wellness evaluation.
          </Clause>
          <div className="rounded-r-md border-l-4 border-amber-600 bg-amber-50 px-3 py-1.5">
            <p className="text-[10.5px] leading-relaxed text-amber-900">
              <strong>Important Reminder:</strong> Domestic pets may react unpredictably to
              unfamiliar stimuli, children, other domestic animals, or environmental changes.
              Strict supervision and gradual acclimation are mandatory to prevent injury or escape.
            </p>
          </div>
        </div>

        <PageFooter page="Page 1 of 2" />
      </section>

      {/* ============================== PAGE 2 ============================== */}
      <section className="waiver-page">
        <div className="space-y-2">
          <SectionTitle>
            Section 3. Comprehensive Release, Indemnification &amp; Custody
          </SectionTitle>
          <Clause n="4" title="Assumption of Risks">
            Adopter knowingly and voluntarily assumes all risks associated with owning, harboring,
            caring for, and handling the adopted animal, including but not limited to bites,
            scratches, transmission of zoonotic illness, transmission of parasite/pathogen to
            resident animals, and damage to personal or real property.
          </Clause>
          <Clause n="5" title="Waiver and Covenant Not to Sue">
            Adopter releases, acquits, and forever discharges the Organization, its board of
            directors, officers, employees, volunteers, foster agents, and sponsors from any and
            all liabilities, claims, demands, damages, or causes of action arising directly or
            indirectly out of the custody, conduct, illness, or actions of the animal.
          </Clause>
          <Clause n="6" title="Indemnification & Defense">
            If any third party (including household members, guests, neighbors, or invitees)
            asserts a claim, lawsuit, or damages resulting from the animal&apos;s behavior or
            possession after handover, Adopter agrees to defend, indemnify, and hold harmless the
            Organization from all costs, judgments, and legal fees.
          </Clause>
          <Clause n="7" title="Financial & Veterinary Responsibility">
            Effective immediately upon physical transfer, Adopter assumes full legal and financial
            responsibility for all veterinary costs, routine care, licensing, feed, medication,
            boarding, and municipal compliance without reimbursement.
          </Clause>
          <Clause n="8" title="Surrender & Return Clause">
            In the event Adopter can no longer maintain custody, Adopter agrees to contact the
            Organization prior to rehoming, surrendering to a municipal pound, or abandoning the
            animal.
          </Clause>
        </div>

        <div className="mt-3 space-y-2">
          <SectionTitle>Section 4. Formal Certification &amp; Signatures</SectionTitle>
          <div className="flex items-start gap-2 rounded-md bg-slate-100 px-3 py-1.5">
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[3px] border border-teal-700 bg-white" />
            <p className="text-[10.5px] leading-relaxed text-slate-700">
              I certify that I am at least 18 years of age, legally competent to execute this
              binding contract, and have read, understood, and voluntarily agree to every
              provision, waiver, and condition stated in this document.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-slate-300 bg-slate-50 p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-teal-800">
                Adopter execution
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
                <SignatureLine label="ID / Driver's license #" />
              </div>
            </div>
            <div className="rounded-md border border-slate-300 bg-slate-50 p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-teal-800">
                Shelter / rescue representative
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SignatureLine label="Authorized representative signature" wide />
                <SignatureLine label="Date (MM/DD/YYYY)" wide={false} />
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
                    Organization seal / stamp
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
