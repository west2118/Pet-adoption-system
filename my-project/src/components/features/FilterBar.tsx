import { RotateCcw, Search } from 'lucide-react';
import type { PetFilters } from '@/types';
import { Input, Select } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';

interface FilterBarProps {
  filters: PetFilters;
  onChange: (key: keyof PetFilters, value: string) => void;
  onReset: () => void;
  activeCount: number;
  breeds: string[];
  locations: string[];
  temperaments: string[];
}

const speciesOptions = [
  { value: 'all', label: 'All species' },
  { value: 'dog', label: 'Dogs' },
  { value: 'cat', label: 'Cats' },
  { value: 'rabbit', label: 'Rabbits' },
  { value: 'bird', label: 'Birds' },
  { value: 'other', label: 'Other' },
];

export const FilterBar = ({
  filters,
  onChange,
  onReset,
  activeCount,
  breeds,
  locations,
  temperaments,
}: FilterBarProps) => {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => onChange('search', e.target.value)}
            placeholder="Search by name, breed, species…"
            className="pl-9"
            aria-label="Search pets"
          />
        </div>
        <Button variant="outline" size="sm" onClick={onReset} disabled={activeCount === 0}>
          <RotateCcw className="size-3.5" /> Reset{activeCount > 0 ? ` (${activeCount})` : ''}
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Select
          aria-label="Species"
          value={filters.species}
          onChange={(e) => onChange('species', e.target.value)}
          options={speciesOptions}
        />
        <Select
          aria-label="Breed"
          value={filters.breed}
          onChange={(e) => onChange('breed', e.target.value)}
          options={[{ value: 'all', label: 'All breeds' }, ...breeds.map((b) => ({ value: b, label: b }))]}
        />
        <Select
          aria-label="Age group"
          value={filters.ageGroup}
          onChange={(e) => onChange('ageGroup', e.target.value)}
          options={[
            { value: 'all', label: 'All ages' },
            { value: 'puppy-kitten', label: 'Puppy / Kitten' },
            { value: 'young', label: 'Young' },
            { value: 'adult', label: 'Adult' },
            { value: 'senior', label: 'Senior' },
          ]}
        />
        <Select
          aria-label="Size"
          value={filters.size}
          onChange={(e) => onChange('size', e.target.value)}
          options={[
            { value: 'all', label: 'All sizes' },
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' },
          ]}
        />
        <Select
          aria-label="Gender"
          value={filters.gender}
          onChange={(e) => onChange('gender', e.target.value)}
          options={[
            { value: 'all', label: 'All genders' },
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
          ]}
        />
        <Select
          aria-label="Temperament"
          value={filters.temperament}
          onChange={(e) => onChange('temperament', e.target.value)}
          options={[
            { value: 'all', label: 'All temperaments' },
            ...temperaments.map((t) => ({ value: t, label: t })),
          ]}
        />
        <Select
          aria-label="Shelter location"
          value={filters.location}
          onChange={(e) => onChange('location', e.target.value)}
          options={[
            { value: 'all', label: 'All locations' },
            ...locations.map((l) => ({ value: l, label: l })),
          ]}
        />
        <Select
          aria-label="Adoption status"
          value={filters.status}
          onChange={(e) => onChange('status', e.target.value)}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'Available', label: 'Available' },
            { value: 'Pending Adoption', label: 'Pending Adoption' },
            { value: 'Fostered', label: 'Fostered' },
            { value: 'Adopted', label: 'Adopted' },
          ]}
        />
      </div>
    </div>
  );
};
