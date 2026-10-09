import { mockApplications, mockPets, mockShelters, mockUsers } from '@/data/mockData';
import { ApiError, apiRequest, tokenStore } from '@/lib/apiClient';
import type {
  AdoptionApplication,
  ApplicationStatus,
  Pet,
  Shelter,
  User,
} from '@/types';

/**
 * Public catalogue service.
 *
 * Reads are dynamic: they hit the Express backend's public endpoints
 * (GET /pets, GET /pets/:id, GET /shelters, GET /shelters/:id) which return
 * only `visibility = 'public'` rows from Postgres.
 *
 * If the backend is unreachable (demo mode), reads fall back to the
 * in-memory mocks so Home / Browse / Shelters still render.
 */

interface PetsListResponse {
  pets: Pet[];
}

interface PetResponse {
  pet: Pet;
}

interface SheltersListResponse {
  shelters: Shelter[];
}

interface ShelterResponse {
  shelter: Shelter;
}

const PUBLIC_PAGE_LIMIT = 100;

export const listPets = async (): Promise<Pet[]> => {
  try {
    const data = await apiRequest<PetsListResponse>(`/pets?limit=${PUBLIC_PAGE_LIMIT}`);
    return data.pets;
  } catch {
    return [...petsStore];
  }
};

export const getPetById = async (id: string): Promise<Pet | undefined> => {
  try {
    const data = await apiRequest<PetResponse>(`/pets/${encodeURIComponent(id)}`);
    return data.pet;
  } catch (err) {
    // 404 from the API means "not public / not found" — mirror it as undefined
    // so detail pages keep showing their EmptyState instead of throwing.
    if (err instanceof Error && 'status' in err && (err as { status: number }).status === 404) {
      return undefined;
    }
    return petsStore.find((p) => p.id === id);
  }
};

export const listPetsByShelter = async (shelterId: string): Promise<Pet[]> => {
  try {
    const data = await apiRequest<PetsListResponse>(
      `/pets?shelterId=${encodeURIComponent(shelterId)}&limit=${PUBLIC_PAGE_LIMIT}`,
    );
    return data.pets;
  } catch {
    return petsStore.filter((p) => p.shelterId === shelterId);
  }
};

const delay = (ms = 250) => new Promise((res) => setTimeout(res, ms));

/** Backend derives the shelter from the staff JWT, so never send shelterId. */
const toListingPayload = (input: Partial<Pet>) => {
  const {
    id: _id,
    shelterId: _shelterId,
    dateAdded: _dateAdded,
    ...payload
  } = input;
  return payload;
};

const shouldFallbackToMock = (err: unknown): boolean =>
  err instanceof ApiError && (err.status === 0 || err.status === 401 || err.status === 403);

let petsStore: Pet[] = [...mockPets];
let applicationsStore: AdoptionApplication[] = [...mockApplications];
let sheltersStore: Shelter[] = [...mockShelters];
let usersStore: User[] = [...mockUsers];

/**
 * Own-shelter inventory (public + private) for the shelter portal.
 * Requires a shelter_staff / platform_admin session; falls back to mocks
 * in demo mode (no token) or when the API is unreachable.
 */
export const listMyListings = async (shelterId?: string | null): Promise<Pet[]> => {
  if (tokenStore.get()) {
    try {
      const data = await apiRequest<PetsListResponse>(
        `/shelter/listings?limit=${PUBLIC_PAGE_LIMIT}`,
        { auth: 'full' },
      );
      return data.pets;
    } catch (err) {
      if (!shouldFallbackToMock(err)) throw err;
    }
  }
  const all = await listPets();
  return shelterId ? all.filter((p) => p.shelterId === shelterId) : all;
};

export const createPet = async (input: Omit<Pet, 'id' | 'dateAdded'>): Promise<Pet> => {
  if (tokenStore.get()) {
    try {
      const data = await apiRequest<PetResponse>('/shelter/listings', {
        method: 'POST',
        body: toListingPayload(input),
        auth: 'full',
      });
      return data.pet;
    } catch (err) {
      if (!shouldFallbackToMock(err)) throw err;
    }
  }
  await delay();
  const pet: Pet = {
    ...input,
    id: `p${Date.now()}`,
    dateAdded: new Date().toISOString().slice(0, 10),
  };
  petsStore = [pet, ...petsStore];
  return pet;
};

export const updatePet = async (id: string, patch: Partial<Pet>): Promise<Pet | undefined> => {
  if (tokenStore.get()) {
    try {
      const data = await apiRequest<PetResponse>(
        `/shelter/listings/${encodeURIComponent(id)}`,
        { method: 'PATCH', body: toListingPayload(patch), auth: 'full' },
      );
      return data.pet;
    } catch (err) {
      if (!shouldFallbackToMock(err)) throw err;
    }
  }
  await delay();
  petsStore = petsStore.map((p) => (p.id === id ? { ...p, ...patch } : p));
  return petsStore.find((p) => p.id === id);
};

export const removePet = async (id: string): Promise<void> => {
  if (tokenStore.get()) {
    try {
      await apiRequest(`/shelter/listings/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        auth: 'full',
      });
      return;
    } catch (err) {
      if (!shouldFallbackToMock(err)) throw err;
    }
  }
  await delay();
  petsStore = petsStore.filter((p) => p.id !== id);
};

export const petService = {
  list: listPets,
  listByShelter: listPetsByShelter,
  listMine: listMyListings,
  getById: getPetById,
  create: createPet,
  update: updatePet,
  remove: removePet,
};

export const listShelters = async (): Promise<Shelter[]> => {
  try {
    const data = await apiRequest<SheltersListResponse>(
      `/shelters?limit=${PUBLIC_PAGE_LIMIT}`,
    );
    return data.shelters;
  } catch {
    return [...sheltersStore];
  }
};

export const getShelterById = async (id: string): Promise<Shelter | undefined> => {
  try {
    const data = await apiRequest<ShelterResponse>(`/shelters/${encodeURIComponent(id)}`);
    return data.shelter;
  } catch (err) {
    if (err instanceof Error && 'status' in err && (err as { status: number }).status === 404) {
      return undefined;
    }
    return sheltersStore.find((s) => s.id === id);
  }
};

export const createShelter = async (
  input: Omit<Shelter, 'id' | 'totalPets'>,
): Promise<Shelter> => {
  await delay();
  const shelter: Shelter = {
    ...input,
    id: `s${Date.now()}`,
    totalPets: 0,
  };
  sheltersStore = [shelter, ...sheltersStore];
  return shelter;
};

export const updateShelter = async (
  id: string,
  patch: Partial<Shelter>,
): Promise<Shelter | undefined> => {
  await delay();
  sheltersStore = sheltersStore.map((s) => (s.id === id ? { ...s, ...patch } : s));
  return sheltersStore.find((s) => s.id === id);
};

export const removeShelter = async (id: string): Promise<void> => {
  await delay();
  sheltersStore = sheltersStore.filter((s) => s.id !== id);
};

export const shelterService = {
  list: listShelters,
  getById: getShelterById,
  create: createShelter,
  update: updateShelter,
  remove: removeShelter,
};

export const listUsers = async (): Promise<User[]> => {
  await delay();
  return [...usersStore];
};

export const createUser = async (input: Omit<User, 'id'>): Promise<User> => {
  await delay();
  const user: User = {
    ...input,
    id: `u${Date.now()}`,
  };
  usersStore = [user, ...usersStore];
  return user;
};

export const updateUser = async (
  id: string,
  patch: Partial<User>,
): Promise<User | undefined> => {
  await delay();
  usersStore = usersStore.map((u) => (u.id === id ? { ...u, ...patch } : u));
  return usersStore.find((u) => u.id === id);
};

export const removeUser = async (id: string): Promise<void> => {
  await delay();
  usersStore = usersStore.filter((u) => u.id !== id);
};

export const userService = {
  list: listUsers,
  create: createUser,
  update: updateUser,
  remove: removeUser,
};

export const listApplications = async (): Promise<AdoptionApplication[]> => {
  await delay();
  return [...applicationsStore];
};

export const listApplicationsByApplicant = async (
  applicantId: string,
): Promise<AdoptionApplication[]> => {
  await delay();
  return applicationsStore.filter((a) => a.applicantId === applicantId);
};

export const createApplication = async (
  input: Omit<AdoptionApplication, 'id' | 'submittedAt' | 'updatedAt' | 'history' | 'status'> & {
    status?: ApplicationStatus;
  },
): Promise<AdoptionApplication> => {
  await delay();
  const now = new Date().toISOString().slice(0, 10);
  const app: AdoptionApplication = {
    ...input,
    id: `a${Date.now()}`,
    status: input.status ?? 'Submitted',
    submittedAt: now,
    updatedAt: now,
    history: [{ status: 'Submitted', date: now }],
  };
  applicationsStore = [app, ...applicationsStore];
  return app;
};

export const updateApplicationStatus = async (
  id: string,
  status: ApplicationStatus,
  note?: string,
): Promise<AdoptionApplication | undefined> => {
  await delay();
  const now = new Date().toISOString().slice(0, 10);
  applicationsStore = applicationsStore.map((a) =>
    a.id === id
      ? {
          ...a,
          status,
          updatedAt: now,
          history: [...a.history, { status, date: now, note }],
        }
      : a,
  );
  return applicationsStore.find((a) => a.id === id);
};

export const applicationService = {
  list: listApplications,
  listByApplicant: listApplicationsByApplicant,
  create: createApplication,
  updateStatus: updateApplicationStatus,
};
