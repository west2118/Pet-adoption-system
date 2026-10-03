import { mockApplications, mockPets, mockShelters, mockUsers } from '@/data/mockData';
import type {
  AdoptionApplication,
  ApplicationStatus,
  Pet,
  Shelter,
  User,
} from '@/types';

/**
 * Service layer prepared for Express.js (local) / Supabase (prod).
 * Currently backed by in-memory mocks so the UI works without a backend.
 * Swap the bodies with fetch()/supabase calls when the API is ready.
 */

const delay = (ms = 250) => new Promise((res) => setTimeout(res, ms));

let petsStore: Pet[] = [...mockPets];
let applicationsStore: AdoptionApplication[] = [...mockApplications];
let sheltersStore: Shelter[] = [...mockShelters];
let usersStore: User[] = [...mockUsers];

export const listPets = async (): Promise<Pet[]> => {
  await delay();
  return [...petsStore];
};

export const getPetById = async (id: string): Promise<Pet | undefined> => {
  await delay(150);
  return petsStore.find((p) => p.id === id);
};

export const createPet = async (input: Omit<Pet, 'id' | 'dateAdded'>): Promise<Pet> => {
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
  await delay();
  petsStore = petsStore.map((p) => (p.id === id ? { ...p, ...patch } : p));
  return petsStore.find((p) => p.id === id);
};

export const removePet = async (id: string): Promise<void> => {
  await delay();
  petsStore = petsStore.filter((p) => p.id !== id);
};

export const listPetsByShelter = async (shelterId: string): Promise<Pet[]> => {
  await delay();
  return petsStore.filter((p) => p.shelterId === shelterId);
};

export const petService = {
  list: listPets,
  listByShelter: listPetsByShelter,
  getById: getPetById,
  create: createPet,
  update: updatePet,
  remove: removePet,
};

export const listShelters = async (): Promise<Shelter[]> => {
  await delay();
  return [...sheltersStore];
};

export const getShelterById = async (id: string): Promise<Shelter | undefined> => {
  await delay(150);
  return sheltersStore.find((s) => s.id === id);
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
