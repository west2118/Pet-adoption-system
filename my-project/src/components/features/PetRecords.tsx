import { Check, X } from 'lucide-react';
import type { Pet } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface PetRecordsProps {
  pet: Pet;
}

/**
 * A single care trait. Three states, not two: the shelters only record some of
 * these fields, and rendering an unrecorded field as "No" would tell an adopter
 * something the shelter never actually said.
 */
const TraitPill = ({ label, value }: { label: string; value: boolean | undefined }) => {
  const state = value === undefined ? 'unknown' : value ? 'yes' : 'no';

  return (
    <li className="flex items-center justify-between gap-3 border-b border-border/70 py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em]',
          state === 'yes' && 'bg-primary/10 text-primary',
          state === 'no' && 'bg-destructive/10 text-destructive',
          state === 'unknown' && 'bg-muted text-muted-foreground',
        )}
      >
        {state === 'yes' && <Check className="size-3" />}
        {state === 'no' && <X className="size-3" />}
        {state === 'unknown' ? 'Not recorded' : state === 'yes' ? 'Yes' : 'No'}
      </span>
    </li>
  );
};

/**
 * Medical history and care traits. Replaces the previous inline "Yes · No" text
 * dumps with two scannable lists.
 */
export const PetRecords = ({ pet }: PetRecordsProps) => {
  const medical = [
    { label: 'Vaccinated', value: pet.vaccinated },
    { label: 'Spayed / neutered', value: pet.spayedNeutered },
    { label: 'Microchipped', value: pet.microchipped },
    { label: 'Dewormed', value: pet.dewormed },
  ];

  const traits = [
    { label: 'Good with kids', value: pet.goodWithKids },
    { label: 'Good with other pets', value: pet.goodWithPets },
    { label: 'Good with strangers', value: pet.goodWithStrangers },
    { label: 'House-trained', value: pet.houseTrained },
    { label: 'Litter-trained', value: pet.litterTrained },
    { label: 'Leash-trained', value: pet.leashTrained },
    { label: 'Crate-trained', value: pet.crateTrained },
    { label: 'Apartment-friendly', value: pet.apartmentFriendly },
  ];

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      {/* Medical */}
      <div className="lg:col-span-5">
        <h3 className="flex items-center gap-3 text-sm font-medium text-foreground">
          <span className="h-px w-8 bg-[var(--brand)]" />
          Medical &amp; care
        </h3>

        <ul className="mt-5 border-t border-border">
          {medical.map((row) => (
            <TraitPill key={row.label} label={row.label} value={row.value} />
          ))}
        </ul>

        {pet.medicalHistory.length > 0 && (
          <ul className="mt-6 space-y-2">
            {pet.medicalHistory.map((entry) => (
              <li key={entry} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {entry}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Traits + behaviour */}
      <div className="lg:col-span-7">
        <h3 className="flex items-center gap-3 text-sm font-medium text-foreground">
          <span className="h-px w-8 bg-[var(--brand)]" />
          Behaviour
        </h3>

        {pet.behavioralNotes && (
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            {pet.behavioralNotes}
          </p>
        )}

        {pet.temperament.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {pet.temperament.map((t) => (
              <Badge key={t} variant="muted" className="capitalize">
                {t}
              </Badge>
            ))}
          </div>
        )}

        <ul className="mt-8 border-t border-border sm:grid sm:grid-cols-2 sm:gap-x-10">
          {traits.map((row) => (
            <TraitPill key={row.label} label={row.label} value={row.value} />
          ))}
        </ul>
      </div>
    </div>
  );
};

/** Compact fact strip for the page's summary band. */
export const PetFactStrip = ({ pet }: PetRecordsProps) => {
  const facts = [
    { value: pet.species, label: 'species' },
    { value: pet.breed, label: 'breed' },
    { value: pet.ageGroup === 'puppy-kitten' ? 'young' : pet.ageGroup, label: 'stage' },
    { value: String(pet.temperament.length), label: 'traits listed' },
  ];

  return (
    <div className="grid grid-cols-2 border-b border-border md:grid-cols-4">
      {facts.map((fact, i) => (
        <div
          key={fact.label}
          className={cn(
            'px-2 py-8 text-center md:px-4 md:py-10',
            i % 2 === 1 ? 'border-l border-border' : '',
            i >= 2 ? 'border-t border-border md:border-t-0' : '',
            'md:border-l md:first:border-l-0',
          )}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {fact.label}
          </p>
          <p className="mt-3 font-display text-2xl capitalize tracking-tight text-primary lg:text-3xl">
            {fact.value}
          </p>
        </div>
      ))}
    </div>
  );
};
