import { Home, Mail, MapPin, PawPrint, Phone, StickyNote } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AdoptionApplication, Pet } from '@/types';
import { DetailsModal } from '@/components/shared';
import { ApplicationStatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/formatters';

interface ApplicationDetailsModalProps {
  application: AdoptionApplication;
  pet?: Pet;
  open: boolean;
  onClose: () => void;
}

interface DetailRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

/** Label-above-value row, matching the compact detail lists used elsewhere. */
const DetailRow = ({ icon: Icon, label, value }: DetailRowProps) => (
  <div className="flex items-start gap-3">
    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
    <div className="min-w-0">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 break-words text-sm text-foreground">{value}</p>
    </div>
  </div>
);

/**
 * Read-only detail view for one adoption application. Rendered through the shared
 * `DetailsModal` — the trigger stays with the card, per the house convention that
 * details views live in a modal rather than an inline panel.
 */
export const ApplicationDetailsModal = ({
  application,
  pet,
  open,
  onClose,
}: ApplicationDetailsModalProps) => (
  <DetailsModal
    open={open}
    onClose={onClose}
    size="lg"
    title={pet ? `${pet.name} — adoption application` : 'Adoption application'}
    description={`${application.applicantName} · submitted ${formatDate(application.submittedAt)}`}
    footer={
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Ref {application.id}
        </p>
        <Link to={`/pets/${application.petId}`}>
          <Button variant="outline" size="sm">
            View pet profile
          </Button>
        </Link>
      </div>
    }
  >
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <ApplicationStatusBadge status={application.status} />
        <span className="text-xs text-muted-foreground">
          Last updated {formatDate(application.updatedAt)}
        </span>
      </div>

      {/* Applicant */}
      <section>
        <h3 className="text-sm font-semibold">Applicant</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <DetailRow icon={Mail} label="Email" value={application.email} />
          <DetailRow icon={Phone} label="Phone" value={application.phone} />
          <DetailRow icon={MapPin} label="Address" value={application.address} />
          <DetailRow
            icon={Home}
            label="Housing"
            value={`${application.housingType}${application.hasOtherPets ? ' · has other pets' : ' · no other pets'}`}
          />
        </div>
      </section>

      {/* Reason */}
      <section className="border-t border-border pt-5">
        <h3 className="text-sm font-semibold">Why they want to adopt</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {application.reason}
        </p>
      </section>

      {/* Experience */}
      <section className="border-t border-border pt-5">
        <h3 className="text-sm font-semibold">Experience</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {application.experience}
        </p>
      </section>

      {/* Staff notes */}
      {application.staffNotes && (
        <section className="border-t border-border pt-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <StickyNote className="size-4 text-muted-foreground" />
            Shelter notes
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {application.staffNotes}
          </p>
        </section>
      )}

      {/* Status history */}
      <section className="border-t border-border pt-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <PawPrint className="size-4 text-muted-foreground" />
          Status history
        </h3>
        {application.history.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No history recorded yet.</p>
        ) : (
          <ol className="mt-3 space-y-3">
            {application.history.map((entry, index) => (
              <li key={`${entry.status}-${entry.date}-${index}`} className="flex gap-3">
                <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted font-mono text-[10px] text-muted-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {entry.status}
                    <span className="font-mono text-[11px] font-normal text-muted-foreground">
                      {formatDate(entry.date)}
                    </span>
                  </p>
                  {entry.note && (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {entry.note}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  </DetailsModal>
);
