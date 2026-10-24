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
    `UPDATE adoption_applications a
      SET status = 'Rejected', staff_notes = $1, updated_at = CURRENT_TIMESTAMP
      WHERE a.pet_id = $2 AND a.id <> $3 AND a.status = ANY($4)
      RETURNING a.id, a.applicant_name, a.email,
        (SELECT u.email FROM users u WHERE u.id = a.applicant_id) AS account_email`,
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
  // Always reach the account that submitted the application; the address on
  // the form is a fallback for legacy rows.
  const applicant = {
    to: record.applicant_account_email || record.email,
    name: record.applicant_name,
    petName,
  };

  if (newStatus === 'Under Review') {
    sendApplicationUnderReviewEmail(applicant).catch(() => {});
  } else if (
    newStatus === 'Approved' ||
    newStatus === 'Rejected' ||
    newStatus === 'Adopted' ||
    newStatus === 'Cancelled'
  ) {
    sendApplicationDecisionEmail({ ...applicant, status: newStatus, note }).catch(() => {});
  }

  const reason =
    newStatus === 'Adopted'
      ? 'This pet has been adopted.'
      : "Another adopter's application for this pet was accepted.";
  for (const competitor of rejectedRows) {
    sendApplicationAutoRejectedEmail({
      to: competitor.account_email || competitor.email,
      name: competitor.applicant_name,
      petName,
      reason,
    }).catch(() => {});
  }
};

/**
 * Adopter withdraws their own application while it is still open. The status
 * moves to `Cancelled` (never `Rejected`, which belongs to shelter decisions),
 * the reason lands in the audit history, and the applicant is emailed a
 * confirmation at the address on their account.
 */
export const cancelApplication = async (applicationId, applicantId, reason) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const appRes = await client.query(
      `SELECT a.*, p.name AS pet_name, u.email AS applicant_account_email
       FROM adoption_applications a
       JOIN pets p ON p.id = a.pet_id
       JOIN users u ON u.id = a.applicant_id
       WHERE a.id = $1
       FOR UPDATE OF a`,
      [applicationId],
    );
    if (appRes.rows.length === 0) {
      throw new AppError('Application not found.', 404);
    }
    const record = appRes.rows[0];
    if (record.applicant_id !== applicantId) {
      throw new AppError('Forbidden. Application belongs to another applicant.', 403);
    }
    if (!['Submitted', 'Under Review'].includes(record.status)) {
      throw new AppError(
        'Only applications that are still under review can be cancelled.',
        409,
      );
    }

    const note = reason?.trim() || 'Cancelled by applicant';
    await client.query(
      `UPDATE adoption_applications
       SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [applicationId],
    );
    await client.query(
      `INSERT INTO application_history (application_id, status, note) VALUES ($1, 'Cancelled', $2)`,
      [applicationId, note],
    );

    await client.query('COMMIT');

    // Fire-and-forget: the withdrawal is already durable.
    sendApplicationDecisionEmail({
      to: record.applicant_account_email || record.email,
      name: record.applicant_name,
      petName: record.pet_name,
      status: 'Cancelled',
      note: reason?.trim() || undefined,
      cancelledByApplicant: true,
    }).catch(() => {});

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

// Atomic: application status + audit history + pet status move together.
export const updateApplicationStatus = async (applicationId, shelterId, newStatus, note) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const appRes = await client.query(
      `SELECT a.*, p.shelter_id, p.id AS pet_id, p.name AS pet_name,
              u.email AS applicant_account_email
       FROM adoption_applications a
       JOIN pets p ON a.pet_id = p.id
       JOIN users u ON u.id = a.applicant_id
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
    // Cancel adoption is only meaningful after approval; pending applications
    // are declined with Rejected instead.
    if (newStatus === 'Cancelled' && record.status !== 'Approved') {
      throw new AppError('Only an approved adoption can be cancelled.', 409);
    }

    // Approving/adopting implies the application was reviewed. Legacy rows can
    // jump straight from Submitted to Approved, which left the Under Review
    // step checked but undated on the adopter's progress track.
    if (newStatus === 'Approved' || newStatus === 'Adopted') {
      const reviewEntry = await client.query(
        `SELECT 1 FROM application_history
          WHERE application_id = $1 AND status = 'Under Review' LIMIT 1`,
        [applicationId],
      );
      if (reviewEntry.rowCount === 0) {
        await client.query(
          `INSERT INTO application_history (application_id, status, note)
           VALUES ($1, 'Under Review', $2)`,
          [applicationId, 'Reviewed by shelter before approval'],
        );
      }
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
    } else if (newStatus === 'Cancelled') {
      // The adoption fell through: the pet is adoptable again.
      await client.query(
        `UPDATE pets
            SET status = 'Available', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 AND status = 'In Process'`,
        [record.pet_id],
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
