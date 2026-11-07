import type { AgeGroup } from '@/types';

export const STATUS_OPTIONS = [
  { value: 'Available', label: 'Available' },
  { value: 'In Process', label: 'In Process' },
  { value: 'Adopted', label: 'Adopted' },
  { value: 'Fostered', label: 'Fostered' },
];

export const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
];

export const VISIBILITY_FILTER_OPTIONS = [
  { value: 'all', label: 'All visibility' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
];

export const SPECIES_FILTER_OPTIONS = [
  { value: 'all', label: 'All species' },
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'rabbit', label: 'Rabbit' },
  { value: 'bird', label: 'Bird' },
  { value: 'other', label: 'Other' },
];

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'Available', label: 'Available' },
  { value: 'In Process', label: 'In Process' },
  { value: 'Adopted', label: 'Adopted' },
  { value: 'Fostered', label: 'Fostered' },
];

export const SPECIES_OPTIONS = [
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'rabbit', label: 'Rabbit' },
  { value: 'bird', label: 'Bird' },
  { value: 'other', label: 'Other' },
];

export const SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export const CARE_FLAG_OPTIONS = [
  ['vaccinated', 'Vaccinated'],
  ['spayedNeutered', 'Spayed / Neutered'],
  ['microchipped', 'Microchipped'],
  ['dewormed', 'Dewormed'],
  ['goodWithKids', 'Good with kids'],
  ['goodWithPets', 'Good with pets'],
  ['goodWithStrangers', 'Good with strangers'],
  ['houseTrained', 'House-trained'],
  ['leashTrained', 'Leash-trained'],
  ['crateTrained', 'Crate-trained'],
  ['litterTrained', 'Litter-trained'],
  ['apartmentFriendly', 'Apartment-friendly'],
] as const;

export const MEDICAL_PRESETS = [
  'Rabies vaccine',
  'DHPP / FVRCP vaccine',
  'Bordetella vaccine',
  'Heartworm test – Negative',
  'Flea & tick prevention',
  'Dental check',
  'Vet health check',
  'Blood panel done',
];

export const TEMPERAMENT_PRESETS = [
  'Friendly',
  'Playful',
  'Calm',
  'Affectionate',
  'Energetic',
  'Loyal',
  'Gentle',
  'Curious',
];

export const BEHAVIOR_PRESETS = [
  'House-trained',
  'Good with kids',
  'Leash-trained',
  'Litter-trained',
  'Knows sit and stay',
  'Needs experienced owner',
  'Prefers a quiet home',
  'Needs daily exercise',
];

export const AGE_GROUP_INFO: { value: AgeGroup; label: string; hint: string }[] = [
  { value: 'puppy-kitten', label: '🐾 Puppy / Kitten', hint: 'under 1 year' },
  { value: 'young', label: '🐾 Young', hint: '1–3 years' },
  { value: 'adult', label: '🐾 Adult', hint: '3–7 years' },
  { value: 'senior', label: '🐾 Senior', hint: '7+ years' },
];

export const FALLBACK_PET_PHOTO =
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80';
