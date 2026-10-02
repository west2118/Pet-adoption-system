import { useMemo, useState } from 'react';
import type { Pet, PetFilters } from '@/types';

export const initialFilters: PetFilters = {
  search: '',
  species: 'all',
  breed: 'all',
  ageGroup: 'all',
  size: 'all',
  gender: 'all',
  temperament: 'all',
  location: 'all',
  status: 'all',
  visibility: 'all',
};

export const usePetFilter = (pets: Pet[], shelters: { id: string; location: string }[]) => {
  const [filters, setFilters] = useState<PetFilters>(initialFilters);

  const shelterLocationById = useMemo(() => {
    const map = new Map<string, string>();
    shelters.forEach((s) => map.set(s.id, s.location));
    return map;
  }, [shelters]);

  const filteredPets = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return pets.filter((pet) => {
      if (q) {
        const hay = `${pet.name} ${pet.breed} ${pet.species}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.species !== 'all' && pet.species !== filters.species) return false;
      if (filters.breed !== 'all' && pet.breed !== filters.breed) return false;
      if (filters.ageGroup !== 'all' && pet.ageGroup !== filters.ageGroup) return false;
      if (filters.size !== 'all' && pet.size !== filters.size) return false;
      if (filters.gender !== 'all' && pet.gender !== filters.gender) return false;
      if (
        filters.temperament !== 'all' &&
        !pet.temperament.some(
          (t) => t.toLowerCase() === filters.temperament.toLowerCase(),
        )
      )
        return false;
      if (filters.location !== 'all') {
        const loc = shelterLocationById.get(pet.shelterId) ?? '';
        if (loc !== filters.location) return false;
      }
      if (filters.status !== 'all' && pet.status !== filters.status) return false;
      if (filters.visibility !== 'all' && pet.visibility !== filters.visibility) return false;
      return true;
    });
  }, [pets, filters, shelterLocationById]);

  const updateFilter = (key: keyof PetFilters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const resetFilters = () => setFilters(initialFilters);

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== 'search' && v !== 'all' && v !== '',
  ).length + (filters.search.trim() ? 1 : 0);

  return { filters, updateFilter, resetFilters, filteredPets, activeFilterCount };
};
