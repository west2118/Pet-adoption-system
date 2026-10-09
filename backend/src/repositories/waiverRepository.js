import { pool } from '../config/database.js';

export const listTemplatesByShelter = async (shelterId, { limit, offset, category, search } = {}) => {
  const conditions = ['shelter_id = $1'];
  const values = [shelterId];

  if (category && category !== 'all') {
    values.push(category);
    conditions.push(`category = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(name ILIKE $${values.length} OR body ILIKE $${values.length})`);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  let query = `SELECT * FROM waiver_templates ${where} ORDER BY created_at ASC`;
  const queryValues = [...values];

  if (limit !== undefined && offset !== undefined) {
    queryValues.push(limit, offset);
    query += ` LIMIT $${queryValues.length - 1} OFFSET $${queryValues.length}`;
  }

  const { rows } = await pool.query(query, queryValues);
  const count = await pool.query(`SELECT COUNT(*)::int AS total FROM waiver_templates ${where}`, values);
  return { rows, total: count.rows[0].total };
};

export const findTemplateById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM waiver_templates WHERE id = $1', [id]);
  return rows[0] ?? null;
};

export const createTemplate = async (shelterId, input) => {
  const { rows } = await pool.query(
    `INSERT INTO waiver_templates (shelter_id, name, category, body, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [shelterId, input.name, input.category ?? 'Adoption', input.body, input.status ?? 'Active'],
  );
  return rows[0];
};

export const updateTemplate = async (id, patch) => {
  const current = await findTemplateById(id);
  if (!current) return null;
  const { rows } = await pool.query(
    `UPDATE waiver_templates
     SET name = $1, category = $2, body = $3, status = $4, updated_at = CURRENT_TIMESTAMP
     WHERE id = $5 RETURNING *`,
    [
      patch.name ?? current.name,
      patch.category ?? current.category,
      patch.body ?? current.body,
      patch.status ?? current.status,
      id,
    ],
  );
  return rows[0] ?? null;
};

export const findWaiverByApplication = async (applicationId) => {
  const { rows } = await pool.query('SELECT * FROM waivers WHERE application_id = $1', [
    applicationId,
  ]);
  return rows[0] ?? null;
};

export const findWaiverById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM waivers WHERE id = $1', [id]);
  return rows[0] ?? null;
};

export const upsertWaiver = async (applicationId, shelterId, snapshot) => {
  const { rows } = await pool.query(
    `INSERT INTO waivers (application_id, shelter_id, snapshot)
     VALUES ($1, $2, $3)
     ON CONFLICT (application_id)
     DO UPDATE SET snapshot = EXCLUDED.snapshot, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [applicationId, shelterId, snapshot],
  );
  return rows[0];
};
