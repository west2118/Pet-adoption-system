import { pool } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { mapApplication } from '../utils/mappers.js';
import {
  createApplication,
  findApplicationById,
  getApplicationHistory,
  listApplicationsByApplicant,
  listApplicationsByShelter,
} from '../repositories/applicationRepository.js';
import { findPetById } from '../repositories/petRepository.js';

export const submitApplication = async (input, applicantId) => {
  const pet = await findPetById(input.petId);
  if (!pet || pet.visibility !== 'public') {
    throw new AppError('Pet not found or not open for applications.', 404);
  }
  if (pet.status !== 'Available') {
    throw new AppError(`Applications are closed for pets with status '${pet.status}'.`, 400);
  }
  const row = await createApplication(input, applicantId);
  const history = await getApplicationHistory(row.id);
  return mapApplication(row, history);
};

export const listMyApplications = async (applicantId, pagination) => {
  const { rows, total } = await listApplicationsByApplicant(applicantId, pagination);
  const applications = await Promise.all(
    rows.map(async (r) => mapApplication(r, await getApplicationHistory(r.id))),
  );
  return { applications, total };
};

export const listShelterApplications = async (shelterId, pagination, status) => {
  const { rows, total } = await listApplicationsByShelter(shelterId, { ...pagination, status });
  const applications = await Promise.all(
    rows.map(async (r) => mapApplication(r, await getApplicationHistory(r.id))),
  );
  return { applications, total };
};

// Atomic: application status + audit history + pet status move together.
export const updateApplicationStatus = async (applicationId, shelterId, newStatus, note) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const appRes = await client.query(
      `SELECT a.*, p.shelter_id, p.id AS pet_id
       FROM adoption_applications a
       JOIN pets p ON a.pet_id = p.id
       WHERE a.id = $1`,
      [applicationId],
    );
    if (appRes.rows.length === 0) {
      throw new AppError('Application not found.', 404);
    }
    const record = appRes.rows[0];
    if (record.shelter_id !== shelterId) {
      throw new AppError('Forbidden. Application belongs to another shelter.', 403);
    }

    await client.query(
      `UPDATE adoption_applications
       SET status = $1, staff_notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [newStatus, note ?? null, applicationId],
    );

    await client.query(
      `INSERT INTO application_history (application_id, status, note) VALUES ($1, $2, $3)`,
      [applicationId, newStatus, note ?? null],
    );

    if (newStatus === 'Approved') {
      await client.query(
        `UPDATE pets SET status = 'Pending Adoption', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [record.pet_id],
      );
    } else if (newStatus === 'Adopted') {
      await client.query(
        `UPDATE pets SET status = 'Adopted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [record.pet_id],
      );
    }

    await client.query('COMMIT');

    const updated = await findApplicationById(applicationId);
    const history = await getApplicationHistory(applicationId);
    return mapApplication(updated, history);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
