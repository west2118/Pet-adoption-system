import type { Waiver } from '@/types';
import { capitalize } from '@/utils/formatters';

/**
 * Print-ready PHOTO, MEDIA & STORY RELEASE AGREEMENT — the two-page media
 * authorization form from the shelter's template, filled dynamically from the
 * waiver snapshot (participant + animal + shelter + authorization date).
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

const Clause = ({ n, title, children }: { n?: string; title: string; children: React.ReactNode }) => (
  <div className="waiver-clause rounded-md border border-slate-200 px-3 py-1.5">
    <p className="text-[10.5px] leading-relaxed text-slate-800">
      {n ? <span className="mr-2 font-extrabold text-violet-900">{n}.</span> : null}
      <strong>{title}:</strong> {children}
    </p>
  </div>
);

const PageFooter = ({ page }: { page: string }) => (
  <div className="mt-4 flex items-center justify-between border-t border-slate-300 pt-2 text-[10px] text-slate-500">
    <span>Pet Adoption Photo, Media &amp; Story Release Agreement</span>
    <span>{page}</span>
  </div>
);

const SignatureLine = ({ label }: { label: string }) => (
  <div>
    <div className="border-b border-slate-900 pb-5" />
    <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
  </div>
);

const ATTRIBUTION_OPTIONS = [
  {
    title: 'Full Attribution',
    text: 'You may publish my full name, municipality/state, and tag my personal social media profiles alongside photos and our adoption story.',
  },
  {
    title: 'First Name Only',
    text: 'You may mention only my first name and pet\u2019s name (e.g. \u201CSarah and Luna\u201D) to protect full family identity.',
  },
  {
    title: 'Pet Only (Anonymous)',
    text: 'Feature only the pet\u2019s name, pictures, and story. Do not mention or publish human names or personal household identifiers.',
  },
];

export const MediaReleaseDocument = ({ waiver }: { waiver: Waiver }) => {
  const { application, pet, shelter, issuedAt } = waiver.snapshot;

  const species = SPECIES_LABEL[pet.species] ?? capitalize(pet.species);
  const microchip = pet.microchipped ? 'Yes — on file with shelter' : 'None recorded';
  const authorized = toMmDdYyyy(issuedAt);

  return (
    <div className="mx-auto max-w-[800px] bg-white text-slate-900">
      {/* ============================== PAGE 1 ============================== */}
      <section className="waiver-page">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-extrabold leading-tight text-violet-950">
              PHOTO, MEDIA &amp; STORY RELEASE AGREEMENT
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-600">
              Marketing, Social Media, Promotional, and Educational Story Authorization
            </p>
          </div>
          <span className="mt-1 shrink-0 rounded border border-violet-800 px-2 py-1 text-center text-[10px] font-extrabold uppercase leading-tight tracking-wide text-violet-900">
            Media •<br />Authorization
          </span>
        </div>
        <div className="mb-3 mt-1 border-b-2 border-violet-950" />

        <div className="rounded-r-md border-l-4 border-violet-900 bg-slate-50 px-3 py-1.5">
          <p className="text-[10.5px] leading-relaxed text-slate-700">
            <strong>Impact of Storytelling:</strong> Sharing adoption stories, photos, and reunion
            milestones directly inspires future adoptions, raises charitable support for homeless
            animals, and educates our community on responsible pet guardianship.
          </p>
        </div>

        <div className="mt-2 space-y-2">
          <SectionTitle>Section 1. Participant &amp; Animal Demographics</SectionTitle>
          <table className="w-full border-collapse text-[10.5px]">
            <tbody>
              <tr>
                <td className="w-[18%] border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Adopter / Foster Name
                </td>
                <td className="border border-slate-300 px-2 py-1 font-medium">
                  {application.applicantName}
                </td>
                <td className="w-[18%] border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Rescue / Shelter Entity
                </td>
                <td className="border border-slate-300 px-2 py-1 font-medium">{shelter.name}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Species / Breed / Color
                </td>
                <td className="border border-slate-300 px-2 py-1">
                  {species} / {pet.breed} / Not recorded
                </td>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Intake / Microchip #
                </td>
                <td className="break-all border border-slate-300 px-2 py-1">
                  {pet.id} • {microchip}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Contact Email / Phone
                </td>
                <td className="border border-slate-300 px-2 py-1">{value(application.email)}</td>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Phone Number
                </td>
                <td className="border border-slate-300 px-2 py-1">{value(application.phone)}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Adoption / Foster Date
                </td>
                <td className="border border-slate-300 px-2 py-1">{authorized}</td>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Date of Finalization
                </td>
                <td className="border border-slate-300 px-2 py-1">{authorized}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  Social Handles (Optional)
                </td>
                <td colSpan={3} className="border border-slate-300 px-2 py-1 text-slate-500">
                  Not provided — write handles here: ________________________________________
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-2 space-y-1.5">
          <SectionTitle>Section 2. Grant of Media Rights &amp; Scope of Use</SectionTitle>
          <Clause n="1" title="Perpetual, Royalty-Free License">
            I hereby grant to the Organization, its legal representatives, successors, and assigns,
            an irrevocable, worldwide, royalty-free license to use, reproduce, display, broadcast,
            and distribute photographic portraits, pictures, audio recordings, video footage, and
            written narratives of myself and/or my adopted pet.
          </Clause>
          <Clause n="2" title="Approved Media Channels">
            Authorized channels include, without limitation: official websites, social media
            profiles (e.g. Facebook, Instagram, YouTube, TikTok), email newsletters, printed
            brochures, promotional banners, annual impact reports, fundraising campaigns, and local
            news / media features.
          </Clause>
          <Clause n="3" title="Ownership of Materials & Waiver of Royalties">
            I acknowledge that I am not entitled to any compensation, royalties, inspection fees, or
            monetary remuneration for the production or publication of these marketing materials. All
            photographic negatives, digital assets, and campaign collateral remain the intellectual
            property of the Organization or its commissioned creators.
          </Clause>
        </div>

        <div className="mt-2 space-y-1.5">
          <SectionTitle>Section 3. Privacy &amp; Identification Preferences</SectionTitle>
          <div className="rounded-md border border-violet-200 bg-violet-50 px-3 py-1.5">
            <p className="text-[10.5px] font-bold text-violet-950">
              Choose your preferred attribution level (select one):
            </p>
            <div className="mt-1 space-y-1">
              {ATTRIBUTION_OPTIONS.map((opt) => (
                <div key={opt.title} className="flex items-start gap-2">
                  <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border border-violet-900 bg-white" />
                  <p className="text-[10.5px] leading-relaxed text-slate-700">
                    <strong>{opt.title}:</strong> {opt.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <PageFooter page="Page 1 of 2" />
      </section>

      {/* ============================== PAGE 2 ============================== */}
      <section className="waiver-page">
        <div className="space-y-1.5">
          <SectionTitle>
            Section 4. Content Alteration, Submissions &amp; Release of Liability
          </SectionTitle>
          <Clause n="4" title="Artistic Editing & Adaptations">
            I consent to the Organization making reasonable edits, color alterations, retouching,
            cropping, or composite treatments to images and adapting written stories for length,
            grammar, or campaign formatting, provided the portrayal remains truthful and respectful.
          </Clause>
          <Clause n="5" title="User-Submitted Content Warranty">
            If I submit updates, photographs, or video files to the Organization via email,
            messaging, or social media, I warrant that I am the sole author or copyright holder (or
            have explicit parental/photographer permission) and authorize the Organization to
            republish such media without restrictions.
          </Clause>
          <Clause n="6" title="Defamation & Privacy Waiver">
            I release, waive, and forever hold harmless the Organization, its Board of Directors,
            staff, volunteers, and partnering media agencies from any claims, demands, or
            liabilities based on invasion of privacy, right of publicity, copyright infringement, or
            defamation arising out of the reasonable use of the materials.
          </Clause>
          <Clause n="7" title="Revocation Guidelines">
            While this release is irrevocable for materials already published, printed, or
            circulated, I may request in writing that future publications cease utilizing my
            individual likeness, effective thirty (30) days from written receipt.
          </Clause>
        </div>

        <div className="mt-2 space-y-1.5">
          <SectionTitle>Section 5. Minor Consent (If Children Under 18 Appear in Photos)</SectionTitle>
          <Clause title="Parental / Guardian Consent">
            If any minor family members appear in photographs or video recordings shared with the
            Organization, the undersigned parental/guardian affirms that they possess legal
            authority to consent on behalf of the minor(s) and agrees that all terms of this media
            release apply fully to said minor(s).
          </Clause>
        </div>

        <div className="mt-2 space-y-1.5">
          <SectionTitle>Section 6. Attestation &amp; Signature Authorization</SectionTitle>
          <div className="flex items-start gap-2 rounded-md bg-slate-100 px-3 py-1.5">
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[3px] border border-violet-900 bg-white" />
            <p className="text-[10.5px] leading-relaxed text-slate-700">
              I certify that I am at least 18 years of age, have read and understand this Photo
              &amp; Story Release Agreement, and voluntarily execute this document with full
              understanding of its legal implications.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-slate-300 bg-slate-50 p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-violet-950">
                Adopter / participant signature
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SignatureLine label="Signature of adopter or legal guardian" />
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
                    Phone number
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-md border border-slate-300 bg-slate-50 p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-violet-950">
                Rescue / shelter witness
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SignatureLine label="Staff / witness signature" />
                <SignatureLine label="Date (MM/DD/YYYY)" />
                <div>
                  <div className="border-b border-slate-900 pb-5" />
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Printed staff name &amp; title
                  </p>
                </div>
                <div>
                  <p className="truncate text-[11px] font-semibold">{shelter.name}</p>
                  <div className="border-b border-slate-900" />
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Verification stamp
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
