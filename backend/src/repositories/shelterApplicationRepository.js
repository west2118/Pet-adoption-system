import { pool } from '../config/database.js';

const SELECT_WITH_APPLICANT = `
  SELECT a.*, u.name AS applicant_name, u.email AS applicant_email
  FROM shelter_applications a
  JOIN users u ON u.id = a.user_id
`;

export const findApplicationByUserId = async (userId) => {
  const { rows } = await pool.query(`${SELECT_WITH_APPLICANT} WHERE a.user_id = $1`, [userId]);
  return rows[0] ?? null;
};

export const findApplicationById = async (id) => {
  const { rows } = await pool.query(`${SELECT_WITH_APPLICANT} WHERE a.id = $1`, [id]);
  return rows[0] ?? null;
};

export const listApplications = async ({ status, limit = 50, offset = 0 } = {}) => {
  const where = status ? 'WHERE a.status = $3' : '';
  const params = status ? [limit, offset, status] : [limit, offset];
  const { rows } = await pool.query(
    `${SELECT_WITH_APPLICANT} ${where} ORDER BY a.submitted_at DESC LIMIT $1 OFFSET $2`,
    params,
  );
  const count = await pool.query(
    status
      ? 'SELECT COUNT(*)::int AS total FROM shelter_applications WHERE status = $1'
      : 'SELECT COUNT(*)::int AS total FROM shelter_applications',
    status ? [status] : [],
  );
  return { rows, total: count.rows[0].total };
};

export const createApplication = async (input) => {
  const { rows } = await pool.query(
    `INSERT INTO shelter_applications
       (user_id, name, location, address, phone, email, operating_hours, description, image_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      input.userId,
      input.name,
      input.location,
      input.address,
      input.phone,
      input.email,
      input.operatingHours,
      input.description,
      input.imageUrl ?? null,
    ],
  );
  return rows[0];
};

export const updateApplicationStatus = async (client, id, status, reviewNote = null) => {
  const { rows } = await client.query(
    `UPDATE shelter_applications
       SET status = $2, review_note = $3, reviewed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 RETURNING *`,
    [id, status, reviewNote],
  );
  return rows[0] ?? null;
};
