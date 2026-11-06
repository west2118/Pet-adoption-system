import { useState } from 'react';
import type { PetFilters } from '@/types';

/** Sentinel used by every select to mean "no constraint on this facet". */
export const ALL_FILTERS = 'all';

export const initialFilters: PetFilters = {
  search: '',
  species: ALL_FILTERS,
  breed: ALL_FILTERS,
  ageGroup: ALL_FILTERS,
  size: ALL_FILTERS,
  gender: ALL_FILTERS,
  temperament: ALL_FILTERS,
  location: ALL_FILTERS,
  status: ALL_FILTERS,
  visibility: ALL_FILTERS,
};

const emptyValueFor = (key: keyof PetFilters) => (key === 'search' ? '' : ALL_FILTERS);

/**
 * Owns the browse page's filter *state* only.
 *
 * Filtering runs in the backend (`GET /pets`), which also owns pagination, so
 * nothing here ever re-filters a page of results — that keeps the client and
 * the server from disagreeing about what "matching" means.
 *
 * The panel itself is described in `@/data/petFilters`, so adding a facet is a
 * data change plus backend support, not new JSX here or in `FilterBar`.
 *
 * @param presetLocation Location pre-selected by the URL, e.g. `/pets?location=Tagaytay`.
 *   It seeds the real `location` facet instead of being applied as a second pass, so
 *   the UI reflects it and "reset" clears the other facets while keeping it.
 */
export const usePetFilter = (presetLocation: string = ALL_FILTERS) => {
  const [filters, setFilters] = useState<PetFilters>(() => ({
    ...initialFilters,
    location: presetLocation,
  }));
  const [appliedPreset, setAppliedPreset] = useState(presetLocation);

  // Re-seed when the URL preset changes underneath us (e.g. navigating from a shelter card).
  if (appliedPreset !== presetLocation) {
    setAppliedPreset(presetLocation);
    setFilters({ ...initialFilters, location: presetLocation });
  }

  const updateFilter = (key: keyof PetFilters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  /** Drops a single facet — backs the removable chips in the filter bar. */
  const clearFilter = (key: keyof PetFilters) =>
    setFilters((prev) => ({ ...prev, [key]: emptyValueFor(key) }));

  const resetFilters = () =>
    setFilters({ ...initialFilters, location: presetLocation });

  const activeFilterCount =
    Object.entries(filters).filter(
      ([k, v]) => k !== 'search' && v !== ALL_FILTERS && v !== '',
    ).length + (filters.search.trim() ? 1 : 0);

  return { filters, updateFilter, clearFilter, resetFilters, activeFilterCount };
};
