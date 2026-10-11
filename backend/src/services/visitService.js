import { AppError } from '../utils/AppError.js';
import {
  VISIT_TRANSITIONS,
  createMessage,
  createThread,
  findOpenThread,
  findThreadById,
  getVisitSummaryByAdopter,
  listThreadMessages,
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.pet_name !== undefined) {
    thread.pet = { id: row.pet_id, name: row.pet_name, imageUrl: row.pet_image ?? '' };
  }
  return thread;
};

export const mapVisitMessage = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    senderName: row.sender_name ?? null,
    senderRole: row.sender_role ?? null,
    body: row.body,
    createdAt: row.created_at,
  };
};

const assertParticipant = (thread, userId, shelterId) => {
  const isAdopter = thread.adopter_id === userId;
  const isShelter = shelterId != null && thread.shelter_id === shelterId;
  if (!isAdopter && !isShelter) {
    throw new AppError('Forbidden. You are not part of this visit thread.', 403);
  }
  return { isAdopter, isShelter };
};

export const requestVisit = async (adopterId, input) => {
  const pet = await findPetById(input.petId);
  if (!pet || pet.visibility !== 'public') {
    throw new AppError('Pet not found or not publicly available.', 404);
  }
  const existing = await findOpenThread(input.petId, adopterId);
  if (existing) {
    throw new AppError('You already have an open visit thread for this pet.', 409);
  }
  const adopter = await findUserById(adopterId);
  const thread = await createThread(
    { petId: input.petId, adopterId, preferredSlot: input.preferredSlot, message: input.message },
    adopterId,
  );
  const messages = await listThreadMessages(thread.id);
  const shelter = await findShelterById(pet.shelter_id);

  // Notify the shelter contact; never blocks the response.
  if (shelter?.email) {
    sendVisitRequestedEmail({
      to: shelter.email,
      name: adopter?.name ?? 'An adopter',
      petName: pet.name,
      preferredSlot: input.preferredSlot,
      message: input.message,
    }).catch(() => {});
  }

  return {
    thread: { ...mapVisitThread({ ...thread, shelter_id: pet.shelter_id }), pet: { id: pet.id, name: pet.name, imageUrl: pet.image_url ?? '' } },
    messages: messages.map(mapVisitMessage),
  };
};

export const listMyVisits = async (adopterId, pagination) => {
  const { rows, total } = await listThreadsByAdopter(adopterId, pagination);
  return { threads: rows.map(mapVisitThread), total };
};

export const getMyVisitSummary = async (adopterId) => getVisitSummaryByAdopter(adopterId);

export const listShelterVisits = async (shelterId, pagination) => {
  const { rows, total } = await listThreadsByShelter(shelterId, pagination);
  return { threads: rows.map(mapVisitThread), total };
};

export const getVisitThread = async (threadId, userId, shelterId) => {
  const thread = await findThreadById(threadId);
  if (!thread) {
    throw new AppError('Visit thread not found.', 404);
  }
  assertParticipant(thread, userId, shelterId);
  const messages = await listThreadMessages(threadId);
  return { thread: mapVisitThread(thread), messages: messages.map(mapVisitMessage) };
};

export const postVisitMessage = async (threadId, senderId, shelterId, body) => {
  const thread = await findThreadById(threadId);
  if (!thread) {
    throw new AppError('Visit thread not found.', 404);
  }
  assertParticipant(thread, senderId, shelterId);
  if (thread.status === 'completed' || thread.status === 'cancelled') {
    throw new AppError('This visit thread is closed.', 409);
  }
  const row = await createMessage(threadId, senderId, body);
  const [message] = await listThreadMessages(threadId).then((rows) =>
    rows.filter((r) => r.id === row.id),
  );
  return mapVisitMessage(message ?? row);
};

export const setVisitStatus = async (threadId, shelterId, input) => {  const thread = await findThreadById(threadId);
  if (!thread) {
    throw new AppError('Visit thread not found.', 404);
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
  if ((input.status === 'proposed' || input.status === 'confirmed') && !input.confirmedSlot && !thread.confirmed_slot) {
    throw new AppError('A confirmed time slot is required.', 400);
  }
  const updated = await updateThreadStatus(threadId, input);
  const adopter = await findUserById(thread.adopter_id);
  const pet = await findPetById(thread.pet_id);

  sendVisitStatusEmail({
    to: adopter?.email,
    name: adopter?.name ?? 'there',
    petName: pet?.name ?? 'the pet',
    status: input.status,
    slot: input.confirmedSlot ?? updated.confirmed_slot ?? undefined,
    reason: input.status === 'cancelled' ? input.cancelReason : undefined,
  }).catch(() => {});

  return mapVisitThread({ ...updated, shelter_id: thread.shelter_id });
};

/** Adopter cancels their own open thread. */
export const cancelVisit = async (threadId, adopterId, cancelReason) => {
  const thread = await findThreadById(threadId);
  if (!thread) {
    throw new AppError('Visit thread not found.', 404);
  }
  if (thread.adopter_id !== adopterId) {
    throw new AppError('Forbidden. This visit belongs to another adopter.', 403);
  }
  if (thread.status === 'completed' || thread.status === 'cancelled') {
    throw new AppError('This visit thread is already closed.', 409);
  }
  const updated = await updateThreadStatus(threadId, {
    status: 'cancelled',
    cancelReason: cancelReason ?? null,
  });
  return mapVisitThread({ ...updated, shelter_id: thread.shelter_id });
};
