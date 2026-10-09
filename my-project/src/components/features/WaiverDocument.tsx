import type { Waiver } from '@/types';
import { formatDate } from '@/utils/formatters';

/**
 * Print-friendly e-waiver document. Every template renders as its own
 * standalone page — letterhead, pet/adopter details, its terms, and its own
 * signature lines — so each waiver reads as a complete document on paper.
 */
export const WaiverDocument = ({ waiver }: { waiver: Waiver }) => {
  const { application, pet, shelter, templates, issuedAt } = waiver.snapshot;

  return (
    <div className="mx-auto max-w-[800px] bg-white text-black">
      {templates.map((t, i) => (
        <section key={t.id} className="waiver-page">
            {/* Letterhead */}
            <div className="border-b-2 border-black pb-4 text-center">
              <h1 className="text-2xl font-bold">{shelter.name}</h1>
              <p className="mt-1 text-xs">
                {shelter.address} · {shelter.phone} · {shelter.email}
              </p>
              <p className="mt-3 text-lg font-semibold underline underline-offset-4">
                {t.name}
              </p>
              <p className="mt-1 text-xs">
                Pet Adoption E-Waiver · {t.category} · Issued {formatDate(issuedAt)}
              </p>
            </div>

            {/* Parties */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded border border-black/20 p-3">
                <h2 className="text-xs font-bold uppercase tracking-wider">Animal</h2>
                <p className="mt-1 font-semibold">
                  {pet.name} · {pet.breed}
                </p>
                <p className="text-xs capitalize">
                  {pet.species} · {pet.gender} · {pet.size} · {pet.ageGroup.replace('-', ' / ')}
                </p>
              </div>
              <div className="rounded border border-black/20 p-3">
                <h2 className="text-xs font-bold uppercase tracking-wider">Adopter</h2>
                <p className="mt-1 font-semibold">{application.applicantName}</p>
                <p className="text-xs">
                  {application.email} · {application.phone}
                </p>
                <p className="text-xs">{application.address}</p>
              </div>
            </div>

            {/* Terms */}
            <div className="mt-4">
              <h2 className="text-sm font-bold">Terms &amp; Agreement</h2>
              <p className="mt-1 text-justify text-sm leading-relaxed">{t.body}</p>
            </div>

            <p className="mt-4 text-xs leading-relaxed">
              By signing below, the adopter confirms they have read and understood the{' '}
              {t.name}, accept full responsibility for {pet.name} from the date of
              adoption, and agree to provide adequate care. This waiver was issued by{' '}
              {shelter.name} on {formatDate(issuedAt)} for adoption application{' '}
              {application.id}.
            </p>

            {/* Physical signature lines */}
            <div className="mt-10 grid grid-cols-2 gap-8 text-sm">
              <div>
                <div className="border-b border-black pb-6" />
                <p className="mt-1 text-xs">Adopter signature over printed name</p>
                <p className="mt-3 border-b border-black pb-6" />
                <p className="mt-1 text-xs">Date</p>
              </div>
              <div>
                <div className="border-b border-black pb-6" />
                <p className="mt-1 text-xs">Shelter representative signature</p>
                <p className="mt-3 border-b border-black pb-6" />
                <p className="mt-1 text-xs">Date</p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-black/50">
              Page {i + 1} of {templates.length}
            </p>
        </section>
      ))}
    </div>
  );
};
