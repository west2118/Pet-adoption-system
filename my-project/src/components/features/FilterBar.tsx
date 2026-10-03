import { useState } from 'react';
import { ChevronDown, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import type { PetFilters } from '@/types';
import { cn } from '@/lib/utils';
import { ALL_FILTERS } from '@/hooks/usePetFilter';
import { Label, Input, Select } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';

interface FilterBarProps {
  filters: PetFilters;
  onChange: (key: keyof PetFilters, value: string) => void;
  onClear: (key: keyof PetFilters) => void;
  onReset: () => void;
  activeCount: number;
  breeds: string[];
  locations: string[];
  temperaments: string[];
}

interface FilterField {
  key: keyof PetFilters;
  label: string;
  options: { value: string; label: string }[];
}

/** The primary facet stays visible as chips — it is the one people reach for first. */
const speciesOptions = [
  { value: ALL_FILTERS, label: 'All' },
  { value: 'dog', label: 'Dogs' },
  { value: 'cat', label: 'Cats' },
  { value: 'rabbit', label: 'Rabbits' },
  { value: 'bird', label: 'Birds' },
  { value: 'other', label: 'Other' },
];

export const FilterBar = ({
  filters,
  onChange,
  onClear,
  onReset,
  activeCount,
  breeds,
  locations,
  temperaments,
}: FilterBarProps) => {
  const [panelOpen, setPanelOpen] = useState(false);

  // Everything that is not `species` or `visibility` — the adopter-facing facets.
  const fields: FilterField[] = [
    {
      key: 'breed',
      label: 'Breed',
      options: [
        { value: ALL_FILTERS, label: 'Any breed' },
        ...breeds.map((b) => ({ value: b, label: b })),
      ],
    },
    {
      key: 'ageGroup',
      label: 'Age',
      options: [
        { value: ALL_FILTERS, label: 'Any age' },
        { value: 'puppy-kitten', label: 'Puppy / Kitten' },
        { value: 'young', label: 'Young' },
        { value: 'adult', label: 'Adult' },
        { value: 'senior', label: 'Senior' },
      ],
    },
    {
      key: 'size',
      label: 'Size',
      options: [
        { value: ALL_FILTERS, label: 'Any size' },
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
      ],
    },
    {
      key: 'gender',
      label: 'Gender',
      options: [
        { value: ALL_FILTERS, label: 'Any gender' },
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
      ],
    },
    {
      key: 'temperament',
      label: 'Temperament',
      options: [
        { value: ALL_FILTERS, label: 'Any temperament' },
        ...temperaments.map((t) => ({ value: t, label: t })),
      ],
    },
    {
      key: 'location',
      label: 'Shelter location',
      options: [
        { value: ALL_FILTERS, label: 'Any location' },
        ...locations.map((l) => ({ value: l, label: l })),
      ],
    },
    {
      key: 'status',
      label: 'Adoption status',
      options: [
        { value: ALL_FILTERS, label: 'Any status' },
        { value: 'Available', label: 'Available' },
        { value: 'Pending Adoption', label: 'Pending Adoption' },
        { value: 'Fostered', label: 'Fostered' },
        { value: 'Adopted', label: 'Adopted' },
      ],
    },
  ];

  const labelFor = (key: keyof PetFilters, value: string) =>
    fields.find((f) => f.key === key)?.options.find((o) => o.value === value)?.label ??
    speciesOptions.find((o) => o.value === value)?.label ??
    value;

  const activeChips: { key: keyof PetFilters; label: string }[] = [
    ...(filters.search.trim()
      ? [{ key: 'search' as const, label: `“${filters.search.trim()}”` }]
      : []),
    ...(filters.species !== ALL_FILTERS
      ? [{ key: 'species' as const, label: labelFor('species', filters.species) }]
      : []),
    ...fields
      .filter((f) => filters[f.key] !== ALL_FILTERS)
      .map((f) => ({ key: f.key, label: labelFor(f.key, filters[f.key]) })),
  ];

  return (
    <div className="space-y-5">
      {/* --------------------------------------------------------- search + trigger */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={filters.search}
            onChange={(e) => onChange('search', e.target.value)}
            placeholder="Search by name, breed or temperament"
            aria-label="Search pets"
            className="h-12 rounded-full pl-11 pr-10 text-[15px]"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onClear('search')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPanelOpen((v) => !v)}
            aria-expanded={panelOpen}
            aria-controls="pet-filter-panel"
            className={cn(
              'h-12 flex-1 rounded-full px-5 sm:flex-none',
              panelOpen && 'border-primary/40 bg-primary/5',
            )}
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {activeCount > 0 && (
              <span className="ml-0.5 flex size-5 items-center justify-center rounded-full bg-primary font-mono text-[10px] font-semibold text-primary-foreground">
                {activeCount}
              </span>
            )}
            <ChevronDown
              className={cn('size-4 transition-transform', panelOpen && 'rotate-180')}
            />
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onReset}
            disabled={activeCount === 0}
            aria-label="Reset all filters"
            className="h-12 rounded-full px-4 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </div>

      {/* -------------------------------------------------- species quick-switch chips */}
      <div className="flex flex-wrap items-center gap-2">
        {speciesOptions.map((option) => {
          const active = filters.species === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange('species', option.value)}
              aria-pressed={active}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-foreground/25 hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------ collapsible panel */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          panelOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden" inert={!panelOpen}>
          <div className="rounded-2xl border bg-muted/30 p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {fields.map((field) => (
                <div key={field.key}>
                  <Label
                    htmlFor={`pet-filter-${field.key}`}
                    className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
                  >
                    {field.label}
                  </Label>
                  <Select
                    id={`pet-filter-${field.key}`}
                    aria-label={field.label}
                    value={filters[field.key]}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    options={field.options}
                    className="h-10 bg-background"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------ removable chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Active
          </span>
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onClear(chip.key)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              {chip.label}
              <X className="size-3" />
              <span className="sr-only">Remove this filter</span>
            </button>
          ))}
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};
