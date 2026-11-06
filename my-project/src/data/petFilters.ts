import type { PetFilters } from '@/types';
import { ALL_FILTERS } from '@/hooks/usePetFilter';

/**
 * Declarative description of the browse-page filter panel.
 *
 * The panel, its "active" chips and the option lists are all derived from
 * `PET_FILTER_FIELDS`, so a new facet is one entry here (plus backend support) —
 * never another copy of the same label/select markup in `FilterBar`.
 */

/** Facet values returned by the backend for the dynamic dropdowns. */
export interface PetFacetValues {
  breeds: string[];
  temperaments: string[];
  locations: string[];
}

/** Facets that render in the panel; search and species have their own controls. */
export type PetFilterKey = Exclude<keyof PetFilters, 'search' | 'species' | 'visibility'>;

interface PetFilterOption {
  value: string;
  label: string;
}

export interface PetFilterField {
  key: PetFilterKey;
  label: string;
  /** Label for the "no constraint" option. */
  anyLabel: string;
  /** Fixed choices; omit when `source` supplies them from the backend. */
  choices?: PetFilterOption[];
  /** Backend facet list backing this field. */
  source?: keyof PetFacetValues;
}

/** Primary facet, kept visible as chips because it is the one people reach for first. */
export const SPECIES_OPTIONS: PetFilterOption[] = [
  { value: ALL_FILTERS, label: 'All' },
  { value: 'dog', label: 'Dogs' },
  { value: 'cat', label: 'Cats' },
  { value: 'rabbit', label: 'Rabbits' },
  { value: 'bird', label: 'Birds' },
  { value: 'other', label: 'Other' },
];

export const PET_FILTER_FIELDS: PetFilterField[] = [
  { key: 'breed', label: 'Breed', anyLabel: 'Any breed', source: 'breeds' },
  {
    key: 'ageGroup',
    label: 'Age',
    anyLabel: 'Any age',
    choices: [
      { value: 'puppy-kitten', label: 'Puppy / Kitten' },
      { value: 'young', label: 'Young' },
      { value: 'adult', label: 'Adult' },
      { value: 'senior', label: 'Senior' },
    ],
  },
  {
    key: 'size',
    label: 'Size',
    anyLabel: 'Any size',
    choices: [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
    ],
  },
  {
    key: 'gender',
    label: 'Gender',
    anyLabel: 'Any gender',
    choices: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
    ],
  },
  { key: 'temperament', label: 'Temperament', anyLabel: 'Any temperament', source: 'temperaments' },
  { key: 'location', label: 'Shelter location', anyLabel: 'Any location', source: 'locations' },
  {
    key: 'status',
    label: 'Adoption status',
    anyLabel: 'Any status',
    choices: [
      { value: 'Available', label: 'Available' },
      { value: 'Fostered', label: 'Fostered' },
    ],
  },
];

const anyOption = (field: PetFilterField): PetFilterOption => ({
  value: ALL_FILTERS,
  label: field.anyLabel,
});

/** Select options for a field: the "any" entry followed by its choices. */
export const filterFieldOptions = (
  field: PetFilterField,
  facets: PetFacetValues,
): PetFilterOption[] => {
  if (field.choices) return [anyOption(field), ...field.choices];
  const values = field.source ? facets[field.source] : [];
  return [anyOption(field), ...values.map((value) => ({ value, label: value }))];
};

/** Human label for an applied value — used by the removable chips. */
export const filterFieldLabel = (field: PetFilterField, value: string): string =>
  field.choices?.find((choice) => choice.value === value)?.label ?? value;
