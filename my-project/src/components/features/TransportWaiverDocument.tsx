import type { Waiver } from '@/types';
import { capitalize } from '@/utils/formatters';

/**
 * Print-ready RESCUE ANIMAL TRANSPORT AGREEMENT & WAIVER — the two-page
 * transport log / route form from the shelter's template, filled dynamically
 * from the waiver snapshot (volunteer transporter + animal + sponsoring
 * shelter + authorization reference).
 *
 * Vehicle- and route-specific fields (licence, insurance, vehicle, plate,
 * pickup/drop-off) are not stored on the platform, so they render as
 * write-in lines for the driver to complete by hand at dispatch.
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

/** Blank write-in line for driver-completed fields (licence, vehicle, route). */
const Blank = ({ wide = false }: { wide?: boolean }) => (
  <span className={wide ? 'block border-b border-slate-400' : 'inline-block min-w-28 border-b border-slate-400'}>
    &nbsp;
  </span>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="border-b border-slate-300 pb-1 text-[13px] font-extrabold uppercase tracking-wide text-slate-900">
    {children}
  </h2>
);

const Clause = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <div className="waiver-clause rounded-md border border-slate-200 px-3 py-1.5">
    <p className="text-[10.5px] leading-relaxed text-slate-800">
      <span className="mr-2 font-extrabold text-orange-800">{n}.</span>
      <strong>{title}:</strong> {children}
    </p>
  </div>
);

const PageFooter = ({ page }: { page: string }) => (
  <div className="mt-4 flex items-center justify-between border-t border-slate-300 pt-2 text-[10px] text-slate-500">
    <span>Pet Transport Liability Waiver &amp; Route Safety Agreement</span>
    <span>{page}</span>
  </div>
);

const SignatureLine = ({ label }: { label: string }) => (
  <div>
    <div className="border-b border-slate-900 pb-5" />
    <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
  </div>
);

export const TransportWaiverDocument = ({ waiver }: { waiver: Waiver }) => {
  const { application, pet, shelter, issuedAt } = waiver.snapshot;

  const species = SPECIES_LABEL[pet.species] ?? capitalize(pet.species);
  const authorized = toMmDdYyyy(issuedAt);
  const routeCode = application.id.replace(/-/g, '').slice(0, 8).toUpperCase();

  return (
    <div className="mx-auto max-w-[800px] bg-white text-slate-900">
      {/* ============================== PAGE 1 ============================== */}
      <section className="waiver-page">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-extrabold leading-tight text-orange-800">
              RESCUE ANIMAL TRANSPORT AGREEMENT &amp; WAIVER
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-600">
              Volunteer Transporter Guidelines, Vehicle Safety, and Risk Assumption
            </p>
          </div>
          <span className="mt-1 shrink-0 rounded border border-orange-700 px-2 py-1 text-center text-[10px] font-extrabold uppercase leading-tight tracking-wide text-orange-800">
            Transport log •<br />Route form
          </span>
        </div>
        <div className="mb-3 mt-1 border-b-2 border-orange-800" />

        <div className="rounded-r-md border-l-4 border-orange-800 bg-slate-50 px-3 py-1.5">
          <p className="text-[10.5px] leading-relaxed text-slate-700">
            <strong>Volunteer Driver Agreement:</strong> This agreement governs the humane, secure
            transportation of shelter and rescue animals between intake facilities, veterinary
            clinics, foster homes, and adoption venues. Drivers act strictly as independent
            volunteer transporters.
          </p>
        </div>

        <div className="mt-2 space-y-2">
          <SectionTitle>Section 1. Transporter, Vehicle &amp; Route Logistics</SectionTitle>
          <table className="w-full border-collapse text-[10.5px]">
            <tbody>
              <tr>
                <td className="w-[18%] border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Volunteer Driver Full Name
                </td>
                <td className="border border-slate-300 px-2 py-1 font-medium">
                  {application.applicantName}
                </td>
                <td className="w-[18%] border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Sponsoring Organization
                </td>
                <td className="border border-slate-300 px-2 py-1 font-medium">{shelter.name}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Mobile Phone / Contact
                </td>
                <td className="border border-slate-300 px-2 py-1">{value(application.phone)}</td>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Emergency Contact Phone
                </td>
                <td className="border border-slate-300 px-2 py-1">
                  <Blank wide /> <span className="text-slate-400">(name &amp; relation)</span>
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Driver&apos;s License # / State
                </td>
                <td className="border border-slate-300 px-2 py-1">
                  <Blank wide />
                </td>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Auto Insurance Carrier
                </td>
                <td className="border border-slate-300 px-2 py-1">
                  <Blank wide /> <span className="text-slate-400">(policy #)</span>
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Vehicle Make, Model &amp; Year
                </td>
                <td className="border border-slate-300 px-2 py-1">
                  <Blank wide />
                </td>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  License Plate #
                </td>
                <td className="border border-slate-300 px-2 py-1">
                  <Blank wide />
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Animal Name &amp; ID #
                </td>
                <td className="border border-slate-300 px-2 py-1 font-medium">
                  {pet.name} • <span className="break-all font-normal">{pet.id}</span>
                </td>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Species / Breed / Weight
                </td>
                <td className="border border-slate-300 px-2 py-1">
                  {species} • {pet.breed} • Not recorded
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Pickup Location &amp; Time
                </td>
                <td className="border border-slate-300 px-2 py-1">
                  <Blank wide /> <span className="text-slate-400">(HH:MM AM/PM)</span>
                </td>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Destination / Handoff Point
                </td>
                <td className="border border-slate-300 px-2 py-1">
                  <Blank wide /> <span className="text-slate-400">(contact name)</span>
                </td>
              </tr>
            </tbody>
          </table>
          <p className="text-[10px] text-slate-500">
            Transport authorized {authorized} · Route code {routeCode} · Application{' '}
            {application.id}
          </p>
        </div>

        <div className="mt-2 space-y-1.5">
          <SectionTitle>Section 2. Containment, Vehicle Safety &amp; Anti-Escape Standards</SectionTitle>
          <Clause n="1" title="Mandatory Secure Containment">
            Animals must be transported in structurally sound, fully latched crates, carriers, or
            approved crash-rated harnesses secured to seatbelt buckles. Cats, small mammals, and
            puppies must never be unrestrained inside the vehicle cabin.
          </Clause>
          <Clause n="2" title="Prohibition on Open Truck Beds">
            Transporting any animal in an open pickup truck bed, open trailer, or unventilated
            vehicle trunk is strictly prohibited under any circumstances.
          </Clause>
          <Clause n="3" title="Climate Control & Heat Safety">
            Vehicles must maintain continuous active climate control (adequate heating or air
            conditioning) within 65°F to 78°F. An animal must never be left unattended inside a
            parked motor vehicle, even for brief rest stops.
          </Clause>
          <Clause n="4" title="Strict Double-Leash / Handoff Protocols">
            When transferring dogs during relay handoffs or necessary relief stops, two points of
            leash restraint (collar plus harness or slip lead) must remain attached before opening
            vehicle doors. All vehicle doors and windows must be closed prior to opening carrier
            latches.
          </Clause>
          <div className="rounded-r-md border-l-4 border-red-700 bg-red-50 px-3 py-1.5">
            <p className="text-[10.5px] leading-relaxed text-red-900">
              <strong>Zero Off-Leash Policy:</strong> Under no circumstances may a transport animal
              be permitted off-leash or allowed in public dog parks during transit legs or rest
              stops.
            </p>
          </div>
        </div>

        <PageFooter page="Page 1 of 2" />
      </section>

      {/* ============================== PAGE 2 ============================== */}
      <section className="waiver-page">
        <div className="space-y-1.5">
          <SectionTitle>
            Section 3. Driver Representations, Insurance &amp; Vehicle Condition
          </SectionTitle>
          <Clause n="5" title="Driver Licensure & Primary Insurance">
            Volunteer Transporter warrants that they possess a valid, non-suspended driver&apos;s
            license and active motor vehicle liability insurance meeting or exceeding state
            statutory minimums. Transporter acknowledges that their personal auto insurance serves
            as the primary policy for any traffic accident, vehicular damage, or collision occurring
            during transport.
          </Clause>
          <Clause n="6" title="Mechanical Roadworthiness">
            Transporter certifies that the operating vehicle is mechanically sound, registered,
            inspected, equipped with functional seat belts and climate control, and free of road
            safety hazards.
          </Clause>
          <Clause n="7" title="Prohibited Conduct">
            Driving under the influence of alcohol, cannabis, narcotics, or prescription medication
            that impairs motor reflexes is grounds for immediate termination of volunteer status
            and potential civil/criminal referral.
          </Clause>
        </div>

        <div className="mt-2 space-y-1.5">
          <SectionTitle>Section 4. Medical Emergency, Lost Animal &amp; Route Incident Protocol</SectionTitle>
          <Clause n="8" title="En-Route Medical Emergencies">
            If an animal exhibits acute distress, heat exhaustion, seizure, or injury, Transporter
            must immediately contact the Transport Coordinator Hotline. If unreachable, Transporter
            is authorized to stop at the nearest emergency veterinary hospital for lifesaving
            stabilization.
          </Clause>
          <Clause n="9" title="Accidental Escape Protocol">
            In the event of an escape, Transporter must stay in the vicinity, deploy immediate
            humane containment methods, contact local animal control, and notify the Organization
            immediately.
          </Clause>
        </div>

        <div className="mt-2 space-y-1.5">
          <SectionTitle>Section 5. Comprehensive Waiver, Indemnification &amp; Assumption of Risk</SectionTitle>
          <Clause n="10" title="Waiver and Hold Harmless">
            Transporter knowingly assumes all risks related to transporting rescue animals,
            including vehicular incidents, personal injury, scratches, bites, disease transmission,
            animal loss, or vehicular contamination/damage. Transporter fully releases, holds
            harmless, and indemnifies the Organization, its directors, employees, and volunteers
            from any and all suits, claims, liabilities, or expenses.
          </Clause>
          <div className="rounded-r-md border-l-4 border-red-700 bg-red-50 px-3 py-1.5">
            <p className="text-[10.5px] leading-relaxed text-red-900">
              <strong>Incident Reporting Mandate:</strong> Any vehicular accident, animal bite
              requiring medical attention, or escape event must be formally reported to the
              Transport Coordinator within one (1) hour of the incident.
            </p>
          </div>
        </div>

        <div className="mt-2 space-y-1.5">
          <SectionTitle>Section 6. Transporter Attestation &amp; Signature Execution</SectionTitle>
          <div className="flex items-start gap-2 rounded-md bg-slate-100 px-3 py-1.5">
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[3px] border border-orange-800 bg-white" />
            <p className="text-[10.5px] leading-relaxed text-slate-700">
              I certify that I am at least 21 years old, hold active automobile insurance and a
              valid driver&apos;s license, and voluntarily agree to all vehicle safety and
              liability terms set forth in this Transport Agreement.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-slate-300 bg-slate-50 p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-orange-900">
                Volunteer transporter
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SignatureLine label="Volunteer driver signature" />
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
                    Emergency contact number
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-md border border-slate-300 bg-slate-50 p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-orange-900">
                Rescue transport coordinator
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SignatureLine label="Coordinator / dispatcher signature" />
                <SignatureLine label="Date (MM/DD/YYYY)" />
                <div>
                  <div className="border-b border-slate-900 pb-5" />
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Printed coordinator name &amp; title
                  </p>
                </div>
                <div>
                  <p className="truncate text-[11px] font-semibold">{routeCode}</p>
                  <div className="border-b border-slate-900" />
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Route authorization code
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-slate-500">
                {shelter.name} · {value(shelter.phone)} · {value(shelter.email)}
              </p>
            </div>
          </div>
        </div>

        <PageFooter page="Page 2 of 2" />
      </section>
    </div>
  );
};
