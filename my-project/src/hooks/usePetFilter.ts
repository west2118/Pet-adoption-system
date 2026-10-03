import { useMemo, useState } from 'react';
import type { Pet, PetFilters } from '@/types';

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

const emptyValueFor = (key: keyof PetFilters) =>
  key === 'search' ? '' : ALL_FILTERS;

/**
 * @param presetLocation Location pre-selected by the URL, e.g. `/pets?location=Tagaytay`.
 *   It seeds the real `location` facet instead of being applied as a second pass, so
 *   the UI reflects it and "reset" clears the other facets while keeping it.
 */
export const usePetFilter = (
  pets: Pet[],
  shelters: { id: string; location: string }[],
  presetLocation: string = ALL_FILTERS,
) => {
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

  const shelterLocationById = useMemo(() => {
    const map = new Map<string, string>();
    shelters.forEach((s) => map.set(s.id, s.location));
    return map;
  }, [shelters]);

  const filteredPets = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return pets.filter((pet) => {
      if (q) {
        const hay =
          `${pet.name} ${pet.breed} ${pet.species} ${pet.description} ${pet.temperament.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.species !== ALL_FILTERS && pet.species !== filters.species)
        return false;
      if (filters.breed !== ALL_FILTERS && pet.breed !== filters.breed) return false;
      if (filters.ageGroup !== ALL_FILTERS && pet.ageGroup !== filters.ageGroup)
        return false;
      if (filters.size !== ALL_FILTERS && pet.size !== filters.size) return false;
      if (filters.gender !== ALL_FILTERS && pet.gender !== filters.gender) return false;
      if (
        filters.temperament !== ALL_FILTERS &&
        !pet.temperament.some(
          (t) => t.toLowerCase() === filters.temperament.toLowerCase(),
        )
      )
        return false;
      if (filters.location !== ALL_FILTERS) {
        const loc = shelterLocationById.get(pet.shelterId) ?? '';
        if (loc !== filters.location) return false;
      }
      if (filters.status !== ALL_FILTERS && pet.status !== filters.status)
        return false;
      if (filters.visibility !== ALL_FILTERS && pet.visibility !== filters.visibility)
        return false;
      return true;
    });
  }, [pets, filters, shelterLocationById]);

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

  return { filters, updateFilter, clearFilter, resetFilters, filteredPets, activeFilterCount };
};
