import { pool } from '../config/database.js';

export const createInquiry = async (input) => {
  const { rows } = await pool.query(
    `INSERT INTO inquiries (pet_id, from_name, from_email, message)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [input.petId, input.fromName, input.fromEmail, input.message],
  );
  return rows[0];
};

export const listInquiriesByShelter = async (shelterId, { limit = 10, offset = 0, resolved, search } = {}) => {
  const conditions = ['p.shelter_id = $1'];
  const values = [shelterId];
  if (resolved !== undefined) {
    values.push(resolved);
    conditions.push(`i.resolved = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    conditions.push(
      `(i.from_name ILIKE $${values.length} OR i.from_email ILIKE $${values.length} OR i.message ILIKE $${values.length} OR p.name ILIKE $${values.length})`,
    );
  }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const { rows } = await pool.query(
    `SELECT i.* FROM inquiries i
     JOIN pets p ON i.pet_id = p.id
     ${where}
     ORDER BY i.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset],
  );
  const count = await pool.query(
    `SELECT COUNT(*)::int AS total FROM inquiries i
     JOIN pets p ON i.pet_id = p.id ${where}`,
    values,
  );
  return { rows, total: count.rows[0].total };
};

export const findInquiryById = async (id) => {
  const { rows } = await pool.query(
    `SELECT i.*, p.shelter_id, p.name AS pet_name,
            s.name AS shelter_name, s.email AS shelter_email
       FROM inquiries i
       JOIN pets p ON i.pet_id = p.id
       LEFT JOIN shelters s ON p.shelter_id = s.id
      WHERE i.id = $1`,
    [id],
  );
  return rows[0] ?? null;
};

export const markInquiryResolved = async (id) => {
  const { rows } = await pool.query(
    'UPDATE inquiries SET resolved = true WHERE id = $1 RETURNING *',
    [id],
  );
  return rows[0] ?? null;
};

/**
 * Records a successfully delivered reply email. The inquiry is also marked
 * resolved because emailing is the inbox's completion action now that the
 * resolve/reopen controls are gone.
 */
export const markInquiryEmailed = async (id, { subject, message }) => {
  const { rows } = await pool.query(
    `UPDATE inquiries
        SET emailed_at = CURRENT_TIMESTAMP,
            email_subject = $2,
            email_message = $3,
            resolved = true
      WHERE id = $1
      RETURNING *`,
    [id, subject, message],
  );
  return rows[0] ?? null;
};
