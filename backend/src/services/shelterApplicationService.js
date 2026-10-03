import { pool } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { mapShelterApplication, mapShelter, mapUser } from '../utils/mappers.js';
import {
  createApplication,
  findApplicationById,
  findApplicationByUserId,
  listApplications,
  updateApplicationStatus,
} from '../repositories/shelterApplicationRepository.js';
import { approveUserAsOwner, setUserAccountStatus } from '../repositories/userRepository.js';
import { createShelter as createShelterRow } from '../repositories/shelterRepository.js';
import {
  sendApplicationReceivedEmail,
  sendShelterApprovedEmail,
  sendShelterRejectedEmail,
} from './mailerService.js';

// Shelters require an image; onboarding treats the logo as optional.
const DEFAULT_SHELTER_IMAGE =
  'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=800&q=80';

export const submitShelterApplication = async (userId, input) => {
  const existing = await findApplicationByUserId(userId);
  if (existing) {
    throw new AppError('You have already submitted a shelter application.', 409);
  }
  const row = await createApplication({ userId, ...input });
  const application = mapShelterApplication(row);

  // Fire-and-forget: a mail failure must not fail the submission.
  sendApplicationReceivedEmail({ to: application.email, name: application.name }).catch(() => {});

  return application;
};

export const getMyShelterApplication = async (userId) => {
  const row = await findApplicationByUserId(userId);
  return mapShelterApplication(row);
};

export const listShelterApplications = async (pagination) => {
  const { rows, total } = await listApplications(pagination);
  return { applications: rows.map((r) => mapShelterApplication(r)), total };
};

/**
 * Approves a shelter application atomically: creates the shelter, promotes the
 * registrant to its owner (approved), and marks the application approved.
 */
export const approveShelterApplication = async (applicationId) => {
  const client = await pool.connect();
  let result;
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT * FROM shelter_applications WHERE id = $1 FOR UPDATE',
      [applicationId],
    );
    const application = rows[0];
    if (!application) {
      throw new AppError('Shelter application not found.', 404);
    }
    if (application.status !== 'pending') {
      throw new AppError('This application has already been reviewed.', 409);
    }

    const shelterRow = await createShelterRow({
      name: application.name,
      location: application.location,
      address: application.address,
      phone: application.phone,
      email: application.email,
      operatingHours: application.operating_hours,
      description: application.description,
      imageUrl: application.image_url || DEFAULT_SHELTER_IMAGE,
    });

    const userRow = await approveUserAsOwner(client, {
      userId: application.user_id,
      shelterId: shelterRow.id,
    });

    await updateApplicationStatus(client, applicationId, 'approved');

    await client.query('COMMIT');
    result = { shelter: mapShelter(shelterRow, 0, 0), user: mapUser(userRow), application };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  sendShelterApprovedEmail({
    to: result.application.email,
    name: result.application.name,
    shelterName: result.shelter.name,
  }).catch(() => {});

  return { shelter: result.shelter, user: result.user };
};

export const rejectShelterApplication = async (applicationId, reviewNote) => {
  const row = await findApplicationById(applicationId);
  if (!row) {
    throw new AppError('Shelter application not found.', 404);
  }
  if (row.status !== 'pending') {
    throw new AppError('This application has already been reviewed.', 409);
  }

  const client = await pool.connect();
  let updated;
  try {
    await client.query('BEGIN');
    await updateApplicationStatus(client, applicationId, 'rejected', reviewNote ?? null);
    await client.query(
      `UPDATE users SET account_status = 'rejected', review_note = $2,
         reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [row.user_id, reviewNote ?? null],
    );
    await client.query('COMMIT');
    updated = mapShelterApplication({ ...row, status: 'rejected', review_note: reviewNote ?? null });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  sendShelterRejectedEmail({
    to: row.email,
    name: row.name,
    reason: reviewNote,
  }).catch(() => {});

  return updated;
};
