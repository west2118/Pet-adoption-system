import { ALL_FILTERS } from '@/hooks/usePetFilter';
import { apiRequest, apiRequestWithMeta } from '@/lib/apiClient';
import type { Pet } from '@/types';

import { PUBLIC_PAGE_LIMIT, isNotFoundError } from './shared';
import type { PaginatedResult, PetResponse, PetsListResponse } from './shared';

export interface PetFacets {
  breeds: string[];
  temperaments: string[];
  stats: { listed: number; available: number; adopted: number };
  species: { species: string; count: number }[];
}

/** Filters the browse page sends to the backend instead of applying itself. */
export interface PublicPetsQuery {
  page?: number;
  /** Page size override; the backend applies its own default when omitted. */
  limit?: number;
  search?: string;
  species?: string;
  breed?: string;
  ageGroup?: string;
  size?: string;
  gender?: string;
  temperament?: string;
  location?: string;
  status?: string;
  /** Scopes the public catalogue to one shelter (shelter profile pets grid). */
  shelterId?: string;
  /** The browse grid only lists pets still looking for a home. */
  excludeAdopted?: boolean;
  /** Visitor coordinates for "Near me"; the backend computes the distance in SQL. */
  latitude?: number;
  longitude?: number;
  /** Optional radius cap in kilometres (omit for "any distance"). */
  radiusKm?: number;
  /** Order the page closest-first (requires latitude/longitude). */
  sortByDistance?: boolean;
}

/** The facet subset of `PublicPetsQuery` that maps 1:1 onto a query param. */
type PublicPetFacet =
  | 'species'
  | 'breed'
  | 'ageGroup'
  | 'size'
  | 'gender'
  | 'temperament'
  | 'location'
  | 'status';

/** Backend default page size for GET /pets, used only if `meta` is absent. */
const PUBLIC_PAGE_SIZE = 12;

const FACET_KEYS: PublicPetFacet[] = [
  'species',
  'breed',
  'ageGroup',
  'size',
  'gender',
  'temperament',
  'location',
  'status',
];

/**
 * Builds the query for a single browse page. The backend owns the page size
 * and answers with `meta { page, limit, total, totalPages }`.
 */
const toPublicPetsQuery = (options: PublicPetsQuery): string => {
  const params = new URLSearchParams();
  params.set('page', String(options.page ?? 1));
  if (options.limit) params.set('limit', String(options.limit));
  const search = options.search?.trim();
  if (search) params.set('search', search);
  FACET_KEYS.forEach((key) => {
    const value = options[key];
    if (typeof value === 'string' && value.trim() !== '' && value !== ALL_FILTERS) {
      params.set(key, value.trim());
    }
  });
  if (options.shelterId) params.set('shelterId', options.shelterId);
  if (options.excludeAdopted) params.set('excludeAdopted', 'true');
  if (options.latitude != null && options.longitude != null) {
    params.set('lat', String(options.latitude));
    params.set('lng', String(options.longitude));
    if (options.radiusKm != null && options.radiusKm > 0) {
      params.set('radiusKm', String(options.radiusKm));
    }
    if (options.sortByDistance) params.set('sort', 'distance');
  }
  return `?${params.toString()}`;
};

export const listPets = async (): Promise<Pet[]> => {
  const data = await apiRequest<PetsListResponse>(`/pets?limit=${PUBLIC_PAGE_LIMIT}`);
  return data.pets;
};

/** A 404 means the pet is not public/does not exist; other failures propagate. */
export const getPetById = async (id: string): Promise<Pet | undefined> => {
  try {
    const data = await apiRequest<PetResponse>(`/pets/${encodeURIComponent(id)}`);
    return data.pet;
  } catch (err) {
    if (isNotFoundError(err)) return undefined;
    throw err;
  }
};

export const listPetsByShelter = async (shelterId: string): Promise<Pet[]> => {
  const data = await apiRequest<PetsListResponse>(
    `/pets?shelterId=${encodeURIComponent(shelterId)}&limit=${PUBLIC_PAGE_LIMIT}`,
  );
  return data.pets;
};

/** One page of the public browse grid, filtered and paged by the backend. */
export const listPetsPaginated = async (
  options: PublicPetsQuery = {},
): Promise<PaginatedResult<Pet>> => {
  const page = options.page ?? 1;
  const { data, meta } = await apiRequestWithMeta<PetsListResponse>(
    `/pets${toPublicPetsQuery(options)}`,
  );
  const limit = meta?.limit ?? options.limit ?? PUBLIC_PAGE_SIZE;
  const total = meta?.total ?? data.pets.length;
  return {
    items: data.pets,
    total,
    page: meta?.page ?? page,
    limit,
    totalPages: meta?.totalPages ?? Math.ceil(total / limit),
  };
};

/**
 * Facet dropdown options + hero counts for the browse page.
 *
 * Deliberately tiny (DISTINCT values and three counts) so the page can keep
 * its headline numbers and filter options without downloading every pet.
 */
export const getPetFacets = async (shelterId?: string): Promise<PetFacets> => {
  const query = shelterId ? `?shelterId=${encodeURIComponent(shelterId)}` : '';
  return apiRequest<PetFacets>(`/pets/facets${query}`);
};

/** Backend derives the shelter from the staff JWT, so never send shelterId. */
const toListingPayload = (input: Partial<Pet>): Partial<Pet> => {
  const payload = { ...input };
  delete payload.id;
  delete payload.shelterId;
  delete payload.dateAdded;
  return payload;
};

/** Own-shelter inventory (public + private) for the shelter portal. */
export const listMyListings = async (): Promise<Pet[]> => {
  const data = await apiRequest<PetsListResponse>(
    `/shelter/listings?limit=${PUBLIC_PAGE_LIMIT}`,
    { auth: 'full' },
  );
  return data.pets;
};

/**
 * One page of the shelter's own inventory.
 *
 * Filtering, search and pagination are owned by the backend
 * (`GET /shelter/listings`): this function only forwards the query and reads
 * the `meta` envelope back. The shelter itself comes from the staff JWT, never
 * from the client.
 */
export const listMyListingsPaginated = async (options: {
  page?: number;
  limit?: number;
  search?: string;
  visibility?: string;
  /** Server-side species filter (`all` or a species value). */
  species?: string;
  /** Server-side status filter (`all` or a PetStatus). */
  status?: string;
} = {}): Promise<PaginatedResult<Pet>> => {
  const page = options.page ?? 1;
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  if (options.limit !== undefined) queryParams.set('limit', String(options.limit));
  if (options.search) queryParams.set('search', options.search);
  if (options.visibility && options.visibility !== 'all') {
    queryParams.set('visibility', options.visibility);
  }
  if (options.species && options.species !== 'all') {
    queryParams.set('species', options.species);
  }
  if (options.status && options.status !== 'all') {
    queryParams.set('status', options.status);
  }

  const { data, meta } = await apiRequestWithMeta<PetsListResponse>(
    `/shelter/listings?${queryParams.toString()}`,
    { auth: 'full' },
  );

  const limit = meta?.limit ?? options.limit ?? 10;
  const total = meta?.total ?? data.pets.length;
  return {
    items: data.pets,
    total,
    page: meta?.page ?? page,
    limit,
    totalPages: meta?.totalPages ?? Math.ceil(total / limit),
  };
};

export const createPet = async (input: Omit<Pet, 'id' | 'dateAdded'>): Promise<Pet> => {
  const data = await apiRequest<PetResponse>('/shelter/listings', {
    method: 'POST',
    body: toListingPayload(input),
    auth: 'full',
  });
  return data.pet;
};

export const updatePet = async (id: string, patch: Partial<Pet>): Promise<Pet> => {
  const data = await apiRequest<PetResponse>(
    `/shelter/listings/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: toListingPayload(patch), auth: 'full' },
  );
  return data.pet;
};

export const removePet = async (id: string): Promise<void> => {
  await apiRequest(`/shelter/listings/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: 'full',
  });
};

export const petService = {
  list: listPets,
  listByShelter: listPetsByShelter,
  listMine: listMyListings,
  listMinePaginated: listMyListingsPaginated,
  getById: getPetById,
  create: createPet,
  update: updatePet,
  remove: removePet,
};
