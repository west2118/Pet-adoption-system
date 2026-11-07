import type { Pet, Shelter } from '@/types';

/** Listings a visitor is allowed to see: public and not already in process. */
export const publicPets = (pets: Pet[]): Pet[] =>
  pets.filter((pet) => pet.visibility === 'public' && pet.status !== 'In Process');

export const getShelterName = (shelters: Shelter[], id: string): string =>
  shelters.find((s) => s.id === id)?.name ?? 'Unknown shelter';

export const getShelterLocation = (shelters: Shelter[], id: string): string =>
  shelters.find((s) => s.id === id)?.location ?? '—';
