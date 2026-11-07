import type { AgeGroup, Pet } from '@/types';

/** Derives standard AgeGroup enum from age in years */
export const ageGroupForYears = (years: number): AgeGroup => {
  if (years < 1) return 'puppy-kitten';
  if (years < 3) return 'young';
  if (years < 7) return 'adult';
  return 'senior';
};

/** Decimal age in years (1 decimal) from a YYYY-MM-DD birthdate, or null. */
export const ageYearsFromBirthdate = (iso: string): number | null => {
  if (!iso) return null;
  const birth = new Date(`${iso}T00:00:00`);
  const now = new Date();
  if (Number.isNaN(birth.getTime()) || birth > now) return null;
  const years = (now.getTime() - birth.getTime()) / (365.25 * 24 * 3600 * 1000);
  return Math.max(0, Math.round(years * 10) / 10);
};

/**
 * Exact calendar age from birthday to present —
 * full years + remaining months + remaining days (day-aware).
 */
export const agePartsFromBirthdate = (
  iso: string,
): { years: number; months: number; days: number } | null => {
  if (!iso) return null;
  const birth = new Date(`${iso}T00:00:00`);
  const now = new Date();
  if (Number.isNaN(birth.getTime()) || birth > now) return null;
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate() + 1;
  if (days <= 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(1, days) };
};

/** Formats exact age into readable string, e.g. "9 days old" or "2 years, 3 months old". */
export const formatExactAge = (parts: { years: number; months: number; days: number }): string => {
  const y = parts.years === 1 ? '1 year' : `${parts.years} years`;
  const m = parts.months === 1 ? '1 month' : `${parts.months} months`;
  const d = parts.days === 1 ? '1 day' : `${parts.days} days`;
  if (parts.years === 0 && parts.months === 0) return `${d} old`;
  if (parts.years === 0) return `${m}, ${d} old`;
  return `${y}, ${m} old`;
};

export const toIsoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Approximate birthdate prefill when editing a pet that only stores ageYears. */
export const birthdateFromAgeYears = (ageYears: number): string => {
  const now = new Date();
  if (ageYears < 1) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 6);
    return toIsoDate(d);
  }
  const d = new Date(now);
  d.setFullYear(d.getFullYear() - Math.round(ageYears));
  return toIsoDate(d);
};

/** Labels of the care flags actually confirmed for a pet — unrecorded ones stay hidden. */
export const getDetailsCareFlags = (pet: Pet): string[] =>
  (
    [
      ['Vaccinated', pet.vaccinated],
      ['Spayed / Neutered', pet.spayedNeutered],
      ['Good with kids', pet.goodWithKids],
      ['Good with pets', pet.goodWithPets],
      ['Microchipped', pet.microchipped ?? false],
      ['Dewormed', pet.dewormed ?? false],
      ['House-trained', pet.houseTrained ?? false],
      ['Good with strangers', pet.goodWithStrangers ?? false],
      ['Leash-trained', pet.leashTrained ?? false],
      ['Crate-trained', pet.crateTrained ?? false],
      ['Litter-trained', pet.litterTrained ?? false],
      ['Apartment-friendly', pet.apartmentFriendly ?? false],
    ] as const
  )
    .filter(([, ok]) => ok)
    .map(([label]) => label);

