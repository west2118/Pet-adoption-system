export const formatAge = (ageYears: number): string => {
  if (ageYears < 1) return 'Kitten / Puppy (<1 yr)';
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
