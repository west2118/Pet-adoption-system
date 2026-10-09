import { mockApplications, mockInquiries, mockPets, mockShelters, mockUsers } from '@/data/mockData';
import { ApiError, apiRequest, apiRequestWithMeta, tokenStore } from '@/lib/apiClient';
import type {
  AdoptionApplication,
  ApplicationStatus,
  Inquiry,
  Pet,
  Shelter,
  User,
} from '@/types';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

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

export const listMyListingsPaginated = async (options: {
  page?: number;
  limit?: number;
  search?: string;
  visibility?: string;
  shelterId?: string | null;
} = {}): Promise<PaginatedResult<Pet>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  if (tokenStore.get()) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', String(page));
      queryParams.set('limit', String(limit));
      if (options.search) queryParams.set('search', options.search);
      if (options.visibility && options.visibility !== 'all') queryParams.set('visibility', options.visibility);

      const { data, meta } = await apiRequestWithMeta<PetsListResponse>(
        `/shelter/listings?${queryParams.toString()}`,
        { auth: 'full' },
      );
      return {
        items: data.pets,
        total: meta?.total ?? data.pets.length,
        page: meta?.page ?? page,
        limit: meta?.limit ?? limit,
      };
    } catch (err) {
      if (!shouldFallbackToMock(err)) throw err;
    }
  }

  let filtered = [...petsStore];
  if (options.shelterId) {
    filtered = filtered.filter((p) => p.shelterId === options.shelterId);
  }
  if (options.visibility && options.visibility !== 'all') {
    filtered = filtered.filter((p) => p.visibility === options.visibility);
  }
  if (options.search) {
    const s = options.search.toLowerCase();
    filtered = filtered.filter(
      (p) => p.name.toLowerCase().includes(s) || p.breed.toLowerCase().includes(s),
    );
  }
  const total = filtered.length;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);
  return { items, total, page, limit };
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

export const listUsersPaginated = async (options: {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
} = {}): Promise<PaginatedResult<User>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  if (tokenStore.get()) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', String(page));
      queryParams.set('limit', String(limit));
      if (options.role && options.role !== 'all') queryParams.set('role', options.role);
      if (options.search) queryParams.set('search', options.search);

      const { data, meta } = await apiRequestWithMeta<{ users: User[] }>(
        `/admin/users?${queryParams.toString()}`,
        { auth: 'full' },
      );
      return {
        items: data.users,
        total: meta?.total ?? data.users.length,
        page: meta?.page ?? page,
        limit: meta?.limit ?? limit,
      };
    } catch (err) {
      if (!shouldFallbackToMock(err)) throw err;
    }
  }

  let filtered = [...usersStore];
  if (options.role && options.role !== 'all') {
    filtered = filtered.filter((u) => u.role === options.role);
  }
  if (options.search) {
    const s = options.search.toLowerCase();
    filtered = filtered.filter(
      (u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s),
    );
  }
  const total = filtered.length;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);
  return { items, total, page, limit };
};

export const listAdminPetsPaginated = async (options: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<PaginatedResult<Pet>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  if (tokenStore.get()) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', String(page));
      queryParams.set('limit', String(limit));
      if (options.search) queryParams.set('search', options.search);

      const { data, meta } = await apiRequestWithMeta<PetsListResponse>(
        `/admin/pets?${queryParams.toString()}`,
        { auth: 'full' },
      );
      return {
        items: data.pets,
        total: meta?.total ?? data.pets.length,
        page: meta?.page ?? page,
        limit: meta?.limit ?? limit,
      };
    } catch (err) {
      if (!shouldFallbackToMock(err)) throw err;
    }
  }

  let filtered = [...petsStore];
  if (options.search) {
    const s = options.search.toLowerCase();
    filtered = filtered.filter(
      (p) => p.name.toLowerCase().includes(s) || p.breed.toLowerCase().includes(s),
    );
  }
  const total = filtered.length;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);
  return { items, total, page, limit };
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
  const target = applicationsStore.find((a) => a.id === id);
  if (!target) return undefined;
  // Mirror the backend rule: accepting one application auto-rejects every
  // other open application for the same pet, and moves the pet itself.
  const rejectable: ApplicationStatus[] =
    status === 'Approved'
      ? ['Submitted', 'Under Review']
      : status === 'Adopted'
        ? ['Submitted', 'Under Review', 'Approved']
        : [];
  const autoNote =
    status === 'Approved'
      ? 'Auto-rejected: another application for this pet was accepted.'
      : status === 'Adopted'
        ? 'Auto-rejected: this pet has been adopted.'
        : undefined;
  applicationsStore = applicationsStore.map((a) => {
    if (a.id === id) {
      return {
        ...a,
        status,
        updatedAt: now,
        staffNotes: note ?? a.staffNotes,
        history: [...a.history, { status, date: now, note }],
      };
    }
    if (a.petId === target.petId && rejectable.includes(a.status) && autoNote) {
      return {
        ...a,
        status: 'Rejected' as ApplicationStatus,
        updatedAt: now,
        staffNotes: autoNote,
        history: [...a.history, { status: 'Rejected' as ApplicationStatus, date: now, note: autoNote }],
      };
    }
    return a;
  });
  if (status === 'Approved' || status === 'Adopted') {
    const petStatus = status === 'Approved' ? 'In Process' : 'Adopted';
    petsStore = petsStore.map((p) =>
      p.id === target.petId ? { ...p, status: petStatus } : p,
    );
  }
  return applicationsStore.find((a) => a.id === id);
};

export const applicationService = {
  list: listApplications,
  listByApplicant: listApplicationsByApplicant,
  create: createApplication,
  updateStatus: updateApplicationStatus,
};

export type { Inquiry } from '@/types';

interface ShelterInquiriesResponse {
  inquiries: Inquiry[];
}

/**
 * Shelter inbox (paginated). The backend scopes rows by the staff JWT, so
 * `shelterId` is only used by the mock fallback in demo mode.
 */
export const listShelterInquiriesPaginated = async (options: {
  page?: number;
  limit?: number;
  resolved?: boolean;
  search?: string;
  shelterId?: string | null;
} = {}): Promise<PaginatedResult<Inquiry>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  if (tokenStore.get()) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', String(page));
      queryParams.set('limit', String(limit));
      if (options.resolved !== undefined) queryParams.set('resolved', String(options.resolved));
      if (options.search) queryParams.set('search', options.search);

      const { data, meta } = await apiRequestWithMeta<ShelterInquiriesResponse>(
        `/shelter/inquiries?${queryParams.toString()}`,
        { auth: 'full' },
      );
      return {
        items: data.inquiries,
        total: meta?.total ?? data.inquiries.length,
        page: meta?.page ?? page,
        limit: meta?.limit ?? limit,
      };
    } catch (err) {
      if (!shouldFallbackToMock(err)) throw err;
    }
  }

  const search = (options.search ?? '').trim().toLowerCase();
  const filtered = mockInquiries.filter((inquiry) => {
    if (options.shelterId) {
      const pet = petsStore.find((p) => p.id === inquiry.petId);
      if (!pet || pet.shelterId !== options.shelterId) return false;
    }
    if (search === '') return true;
    const petName = petsStore.find((p) => p.id === inquiry.petId)?.name ?? '';
    return `${inquiry.fromName} ${inquiry.fromEmail} ${inquiry.message} ${petName}`
      .toLowerCase()
      .includes(search);
  });
  const total = filtered.length;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);
  return { items, total, page, limit };
};
