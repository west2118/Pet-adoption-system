import { AppError } from '../utils/AppError.js';
import {
  VISIT_TRANSITIONS,
  createThread,
  findThreadByPetAndAdopter,
  findThreadById,
  getVisitSummaryByAdopter,
  listThreadsByAdopter,
  listThreadsByShelter,
  updateThreadStatus,
} from '../repositories/visitRepository.js';
import { findPetById } from '../repositories/petRepository.js';
import { findShelterById } from '../repositories/shelterRepository.js';
import { findUserById } from '../repositories/userRepository.js';
import { sendVisitRequestedEmail, sendVisitStatusEmail } from './mailerService.js';

export const mapVisitThread = (row) => {
  if (!row) return null;
  const thread = {
    id: row.id,
    petId: row.pet_id,
    adopterId: row.adopter_id,
    status: row.status,
    preferredSlot: row.preferred_slot ?? '',
    confirmedSlot: row.confirmed_slot ?? null,
    cancelReason: row.cancel_reason ?? null,
    shelterMessage: row.shelter_message ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.pet_name !== undefined) {
    thread.pet = { id: row.pet_id, name: row.pet_name, imageUrl: row.pet_image ?? '' };
  }
  if (row.adopter_name !== undefined) {
    thread.adopter = {
      id: row.adopter_id,
      name: row.adopter_name,
      email: row.adopter_email ?? null,
    };
  }
  return thread;
};

const assertParticipant = (thread, userId, shelterId) => {
  const isAdopter = thread.adopter_id === userId;
  const isShelter = shelterId != null && thread.shelter_id === shelterId;
  if (!isAdopter && !isShelter) {
    throw new AppError('Forbidden. You are not part of this visit request.', 403);
  }
  return { isAdopter, isShelter };
};

/** Creates the single visit request for a (pet, adopter) pair. */
export const requestVisit = async (adopterId, input) => {
  const pet = await findPetById(input.petId);
  if (!pet || pet.visibility !== 'public') {
    throw new AppError('Pet not found or not publicly available.', 404);
  }
  const existing = await findThreadByPetAndAdopter(input.petId, adopterId);
  if (existing) {
    throw new AppError(
      'You have already requested a visit for this pet. Check My visits for its status.',
      409,
    );
  }
  const adopter = await findUserById(adopterId);
  let thread;
  try {
    thread = await createThread({
      petId: input.petId,
      adopterId,
      preferredSlot: input.preferredSlot,
    });
  } catch (err) {
    // The unique (pet_id, adopter_id) constraint backstops the check above
    // when two requests race each other.
    if (err?.code === '23505') {
      throw new AppError(
        'You have already requested a visit for this pet. Check My visits for its status.',
        409,
      );
    }
    throw err;
  }
  const shelter = await findShelterById(pet.shelter_id);

  // Notify the shelter contact; never blocks the response. The shelter
  // approves or declines from the dashboard, which emails the adopter.
  if (shelter?.email) {
    sendVisitRequestedEmail({
      to: shelter.email,
      name: adopter?.name ?? 'An adopter',
      petName: pet.name,
      preferredSlot: input.preferredSlot,
    }).catch(() => {});
  }

  return {
    thread: mapVisitThread({
      ...thread,
      shelter_id: pet.shelter_id,
      pet_name: pet.name,
      pet_image: pet.image_url,
      adopter_name: adopter?.name ?? null,
      adopter_email: adopter?.email ?? null,
    }),
  };
};

export const listMyVisits = async (adopterId, pagination) => {
  const { rows, total } = await listThreadsByAdopter(adopterId, pagination);
  return { threads: rows.map(mapVisitThread), total };
};

export const getMyVisitSummary = async (adopterId) => getVisitSummaryByAdopter(adopterId);

/** The adopter's request for one pet, or null — drives the pet-page state. */
export const getMyVisitForPet = async (adopterId, petId) => {
  const row = await findThreadByPetAndAdopter(petId, adopterId);
  return mapVisitThread(row);
};

export const listShelterVisits = async (shelterId, pagination) => {
  const { rows, total } = await listThreadsByShelter(shelterId, pagination);
  return { threads: rows.map(mapVisitThread), total };
};

export const getVisitThread = async (threadId, userId, shelterId) => {
  const thread = await findThreadById(threadId);
  if (!thread) {
    throw new AppError('Visit request not found.', 404);
  }
  assertParticipant(thread, userId, shelterId);
  return { thread: mapVisitThread(thread) };
};

/**
 * Shelter decision: `confirmed` approves the request (at the proposed slot
 * unless another is given), `cancelled` declines/cancels it. Both send the
 * adopter an email and keep the request's status up to date.
 */
export const setVisitStatus = async (threadId, shelterId, input) => {
  const thread = await findThreadById(threadId);
  if (!thread) {
    throw new AppError('Visit request not found.', 404);
  }
  if (thread.shelter_id !== shelterId) {
    throw new AppError('Forbidden. Visit belongs to another shelter.', 403);
  }
  const allowed = VISIT_TRANSITIONS[thread.status] ?? [];
  if (!allowed.includes(input.status)) {
    throw new AppError(
      `Cannot move a ${thread.status} visit to ${input.status}.`,
      409,
    );
  }

  // Approving confirms the adopter's preferred slot unless the shelter
  // proposes a different time.
  const confirmedSlot =
    input.status === 'confirmed'
      ? input.confirmedSlot || thread.confirmed_slot || thread.preferred_slot
      : input.confirmedSlot;

  const updated = await updateThreadStatus(threadId, { ...input, confirmedSlot });
  const adopter = await findUserById(thread.adopter_id);
  const pet = await findPetById(thread.pet_id);

  sendVisitStatusEmail({
    to: adopter?.email,
    name: adopter?.name ?? 'there',
    petName: pet?.name ?? 'the pet',
    status: input.status,
    slot: confirmedSlot ?? updated.confirmed_slot ?? undefined,
    // The confirmation email carries the shelter's visit date + message; a
    // decline/cancellation carries the reason instead.
    reason: input.status === 'cancelled' ? input.cancelReason : input.message,
  }).catch(() => {});

  return mapVisitThread({
    ...updated,
    shelter_id: thread.shelter_id,
    pet_name: thread.pet_name,
    pet_image: thread.pet_image,
    adopter_name: thread.adopter_name,
    adopter_email: thread.adopter_email,
  });
};

/** Adopter cancels their own open request. */
export const cancelVisit = async (threadId, adopterId, cancelReason) => {
  const thread = await findThreadById(threadId);
  if (!thread) {
    throw new AppError('Visit request not found.', 404);
  }
  if (thread.adopter_id !== adopterId) {
    throw new AppError('Forbidden. This visit belongs to another adopter.', 403);
  }
  if (thread.status === 'completed' || thread.status === 'cancelled') {
    throw new AppError('This visit request is already closed.', 409);
  }
  const updated = await updateThreadStatus(threadId, {
    status: 'cancelled',
    cancelReason: cancelReason ?? null,
  });
  return mapVisitThread({ ...updated, shelter_id: thread.shelter_id });
};
