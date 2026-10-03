import { pool } from '../config/database.js';

export const createInquiry = async (input) => {
  const { rows } = await pool.query(
    `INSERT INTO inquiries (pet_id, from_name, from_email, message)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [input.petId, input.fromName, input.fromEmail, input.message],
  );
  return rows[0];
};

export const listInquiriesByShelter = async (shelterId, { limit, offset, resolved }) => {
  const values = [shelterId];
  let extra = '';
  if (resolved !== undefined) {
    values.push(resolved);
    extra = `AND i.resolved = $${values.length}`;
  }
  const { rows } = await pool.query(
    `SELECT i.* FROM inquiries i
     JOIN pets p ON i.pet_id = p.id
     WHERE p.shelter_id = $1 ${extra}
     ORDER BY i.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset],
  );
  const count = await pool.query(
    `SELECT COUNT(*)::int AS total FROM inquiries i
     JOIN pets p ON i.pet_id = p.id WHERE p.shelter_id = $1 ${extra}`,
    values,
  );
  return { rows, total: count.rows[0].total };
};

export const findInquiryById = async (id) => {
  const { rows } = await pool.query(
    `SELECT i.*, p.shelter_id FROM inquiries i JOIN pets p ON i.pet_id = p.id WHERE i.id = $1`,
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
