export const ageYearsFromBirthdate = (iso: string): number => {
  if (!iso) return 0;
  const birth = new Date(`${iso.slice(0, 10)}T00:00:00`);
  const now = new Date();
  if (Number.isNaN(birth.getTime()) || birth > now) return 0;
  const years = (now.getTime() - birth.getTime()) / (365.25 * 24 * 3600 * 1000);
  return Math.max(0, Math.round(years * 10) / 10);
};

export const getPetAgeYears = (
  pet: { birthdate?: string; ageYears?: number } | number,
): number => {
  if (typeof pet === 'number') return pet;
  if (pet.birthdate) return ageYearsFromBirthdate(pet.birthdate);
  return pet.ageYears ?? 0;
};

export const formatAge = (
  ageInput: number | { birthdate?: string; ageYears?: number },
): string => {
  const ageYears = getPetAgeYears(ageInput);
  if (ageYears <= 0) return 'Under 1 year old';
  if (ageYears < 1) {
    const months = Math.round(ageYears * 12);
    if (months === 1) return '1 month old';
    if (months > 1) return `${months} months old`;
    return 'Under 1 year old';
  }
  if (ageYears === 1) return '1 year old';
  return `${ageYears} years old`;
};

export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const capitalize = (value: string): string => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};
