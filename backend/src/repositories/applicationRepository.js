import { pool } from '../config/database.js';

export const createApplication = async (input, applicantId) => {
  const { rows } = await pool.query(
    `INSERT INTO adoption_applications
       (pet_id, applicant_id, applicant_name, email, phone, address, housing_type, has_other_pets, experience, reason)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      input.petId, applicantId, input.applicantName, input.email, input.phone,
      input.address, input.housingType, input.hasOtherPets ?? false,
      input.experience, input.reason,
    ],
  );
  const app = rows[0];
  await pool.query(
    `INSERT INTO application_history (application_id, status, note) VALUES ($1, $2, $3)`,
    [app.id, app.status, 'Application submitted'],
  );
  return app;
};

export const findApplicationById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM adoption_applications WHERE id = $1', [id]);
  return rows[0] ?? null;
};

export const getApplicationHistory = async (applicationId, client = pool) => {
  const { rows } = await client.query(
    'SELECT * FROM application_history WHERE application_id = $1 ORDER BY created_at ASC',
    [applicationId],
  );
  return rows;
};

export const listApplicationsByApplicant = async (applicantId, { limit, offset }) => {
  const { rows } = await pool.query(
    'SELECT * FROM adoption_applications WHERE applicant_id = $1 ORDER BY submitted_at DESC LIMIT $2 OFFSET $3',
    [applicantId, limit, offset],
  );
  const count = await pool.query(
    'SELECT COUNT(*)::int AS total FROM adoption_applications WHERE applicant_id = $1',
    [applicantId],
  );
  return { rows, total: count.rows[0].total };
};

/**
 * Status counters across ALL of an adopter's applications — the summary bar
 * has to stay correct while the list itself is paged at 5 per request.
 */
export const getApplicationSummaryByApplicant = async (applicantId) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'Under Review')::int AS under_review,
            COUNT(*) FILTER (WHERE status = 'Approved')::int AS approved,
            COUNT(*) FILTER (WHERE status = 'Adopted')::int AS adopted
       FROM adoption_applications
      WHERE applicant_id = $1`,
    [applicantId],
  );
  const row = rows[0];
  return {
    total: row.total,
    underReview: row.under_review,
    approved: row.approved,
    adopted: row.adopted,
  };
};

export const listApplicationsByShelter = async (shelterId, { limit = 10, offset = 0, status, search } = {}) => {
  const conditions = ['p.shelter_id = $1'];
  const values = [shelterId];
  if (status && status !== 'all') {
    values.push(status);
    conditions.push(`a.status = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    conditions.push(
      `(a.applicant_name ILIKE $${values.length} OR a.email ILIKE $${values.length} OR p.name ILIKE $${values.length})`,
    );
  }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const { rows } = await pool.query(
    `SELECT a.* FROM adoption_applications a
     JOIN pets p ON a.pet_id = p.id
     ${where}
     ORDER BY a.submitted_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset],
  );
  const count = await pool.query(
    `SELECT COUNT(*)::int AS total FROM adoption_applications a
     JOIN pets p ON a.pet_id = p.id ${where}`,
    values,
  );
  return { rows, total: count.rows[0].total };
};
