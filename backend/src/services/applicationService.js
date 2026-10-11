import { pool } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { mapApplication } from '../utils/mappers.js';
import {
  createApplication,
  findApplicationById,
  getApplicationHistory,
  getApplicationSummaryByApplicant,
  listApplicationsByApplicant,
  listApplicationsByShelter,
} from '../repositories/applicationRepository.js';
import { findPetById } from '../repositories/petRepository.js';
import {
  sendApplicationSubmittedEmail,
  sendApplicationUnderReviewEmail,
  sendApplicationDecisionEmail,
  sendApplicationAutoRejectedEmail,
} from './mailerService.js';

export const submitApplication = async (input, applicantId) => {
  const pet = await findPetById(input.petId);
  if (!pet || pet.visibility !== 'public') {
    throw new AppError('Pet not found or not open for applications.', 404);
  }
  if (pet.status !== 'Available') {
    throw new AppError(`Applications are closed for pets with status '${pet.status}'.`, 400);
  }
  const row = await createApplication(input, applicantId);

  // Fire-and-forget acknowledgement — a mail failure must never fail the submission.
  sendApplicationSubmittedEmail({
    to: row.email,
    name: row.applicant_name,
    petName: pet.name,
  }).catch(() => {});

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

export const getApplicationSummary = async (applicantId) =>
  getApplicationSummaryByApplicant(applicantId);

export const listShelterApplications = async (shelterId, options = {}) => {
  const { rows, total } = await listApplicationsByShelter(shelterId, options);
  const applications = await Promise.all(
    rows.map(async (r) => mapApplication(r, await getApplicationHistory(r.id))),
  );
  return { applications, total };
};

// Auto-rejects every other open application for the same pet inside the
// same transaction, so accepting one adopter can never leave competitors
// hanging. Returns the rejected rows (id, applicant_name, email) so the caller
// can notify them once the transaction has committed.
const autoRejectCompetingApplications = async (
  client,
  petId,
  acceptedId,
  statuses,
  note,
) => {
  const { rows } = await client.query(
    `UPDATE adoption_applications
      SET status = 'Rejected', staff_notes = $1, updated_at = CURRENT_TIMESTAMP
      WHERE pet_id = $2 AND id <> $3 AND status = ANY($4)
      RETURNING id, applicant_name, email`,
    [note, petId, acceptedId, statuses],
  );
  for (const row of rows) {
    await client.query(
      `INSERT INTO application_history (application_id, status, note) VALUES ($1, 'Rejected', $2)`,
      [row.id, note],
    );
  }
  return rows;
};

/**
 * Fire-and-forget status notifications. Never awaited and never throws: the
 * status change is already committed, so a mail hiccup cannot affect it.
 */
const notifyApplicationStatusChange = ({ record, petName, newStatus, note, rejectedRows }) => {
  const applicant = { to: record.email, name: record.applicant_name, petName };

  if (newStatus === 'Under Review') {
    sendApplicationUnderReviewEmail(applicant).catch(() => {});
  } else if (newStatus === 'Approved' || newStatus === 'Rejected' || newStatus === 'Adopted') {
    sendApplicationDecisionEmail({ ...applicant, status: newStatus, note }).catch(() => {});
  }

  const reason =
    newStatus === 'Adopted'
      ? 'This pet has been adopted.'
      : "Another adopter's application for this pet was accepted.";
  for (const competitor of rejectedRows) {
    sendApplicationAutoRejectedEmail({
      to: competitor.email,
      name: competitor.applicant_name,
      petName,
      reason,
    }).catch(() => {});
  }
};

// Atomic: application status + audit history + pet status move together.
export const updateApplicationStatus = async (applicationId, shelterId, newStatus, note) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const appRes = await client.query(
      `SELECT a.*, p.shelter_id, p.id AS pet_id, p.name AS pet_name
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

    // Competitors closed by this transition — notified after COMMIT.
    let rejectedRows = [];

    if (newStatus === 'Approved') {
      await client.query(
        `UPDATE pets SET status = 'In Process', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [record.pet_id],
      );
      // One accepted adopter per pet — every other open application for the
      // same pet is rejected automatically with an audit trail.
      rejectedRows = await autoRejectCompetingApplications(
        client,
        record.pet_id,
        applicationId,
        ['Submitted', 'Under Review'],
        'Auto-rejected: another application for this pet was accepted.',
      );
    } else if (newStatus === 'Adopted') {
      await client.query(
        `UPDATE pets SET status = 'Adopted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [record.pet_id],
      );
      // Safety net: nothing may stay open once the pet is adopted.
      rejectedRows = await autoRejectCompetingApplications(
        client,
        record.pet_id,
        applicationId,
        ['Submitted', 'Under Review', 'Approved'],
        'Auto-rejected: this pet has been adopted.',
      );
    }

    await client.query('COMMIT');

    // Only now is the change durable — notifications go out without blocking
    // the response, and pet_name comes from the join above.
    notifyApplicationStatusChange({
      record,
      petName: record.pet_name,
      newStatus,
      note,
      rejectedRows,
    });

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
