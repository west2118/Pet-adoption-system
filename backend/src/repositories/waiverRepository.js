import { pool } from '../config/database.js';

export const listTemplatesByShelter = async (shelterId) => {
  const { rows } = await pool.query(
    'SELECT * FROM waiver_templates WHERE shelter_id = $1 ORDER BY created_at ASC',
    [shelterId],
  );
  return rows;
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
