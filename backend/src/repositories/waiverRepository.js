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
    `INSERT INTO waiver_templates (shelter_id, name, category, body, status, is_default)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      shelterId,
      input.name,
      input.category ?? 'Adoption',
      input.body,
      input.status ?? 'Active',
      input.isDefault ?? false,
    ],
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

export const deleteTemplate = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM waiver_templates WHERE id = $1', [id]);
  return rowCount > 0;
};

export const findWaiverByApplication = async (applicationId) => {
  const { rows } = await pool.query('SELECT * FROM waivers WHERE application_id = $1', [
    applicationId,
  ]);
  return rows[0] ?? null;
};

export const findWaiverByApplicationForUpdate = async (client, applicationId) => {
  const { rows } = await client.query(
    'SELECT * FROM waivers WHERE application_id = $1 FOR UPDATE',
    [applicationId],
  );
  return rows[0] ?? null;
};

export const findWaiverById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM waivers WHERE id = $1', [id]);
  return rows[0] ?? null;
};

/** Archive the current snapshot before a regeneration replaces it. */
export const archiveWaiverVersion = async (client, current) => {
  await client.query(
    `INSERT INTO waiver_versions
       (waiver_id, application_id, shelter_id, version, snapshot, status,
        generated_at, generated_by, generated_by_name, signed_at, signed_by,
        signed_by_name, signature_name)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (waiver_id, version) DO NOTHING`,
    [
      current.id,
      current.application_id,
      current.shelter_id,
      current.version,
      current.snapshot,
      current.status === 'Signed' ? 'Signed' : 'Superseded',
      current.generated_at,
      current.generated_by,
      current.generated_by_name,
      current.signed_at,
      current.signed_by,
      current.signed_by_name,
      current.signature_name,
    ],
  );
};

export const insertGeneratedWaiver = async (client, input) => {
  const { rows } = await client.query(
    `INSERT INTO waivers
       (application_id, shelter_id, snapshot, status, version, generated_at,
        generated_by, generated_by_name)
     VALUES ($1,$2,$3,'Issued',$4,$5,$6,$7)
     RETURNING *`,
    [
      input.applicationId,
      input.shelterId,
      input.snapshot,
      input.version,
      input.generatedAt,
      input.generatedBy,
      input.generatedByName,
    ],
  );
  return rows[0];
};

/**
 * Replace the current snapshot after archiving it. Signing fields are reset
 * because this method only runs for an unsigned, issued waiver.
 */
export const updateGeneratedWaiver = async (client, input) => {
  const { rows } = await client.query(
    `UPDATE waivers
        SET snapshot = $1,
            status = 'Issued',
            version = $2,
            generated_at = $3,
            generated_by = $4,
            generated_by_name = $5,
            signed_at = NULL,
            signed_by = NULL,
            signed_by_name = NULL,
            signature_name = NULL,
            updated_at = CURRENT_TIMESTAMP
      WHERE application_id = $6
      RETURNING *`,
    [
      input.snapshot,
      input.version,
      input.generatedAt,
      input.generatedBy,
      input.generatedByName,
      input.applicationId,
    ],
  );
  return rows[0];
};

export const signWaiverRecord = async (
  waiverId,
  { snapshot, signedBy, signedByName, signatureName },
  client = pool,
) => {
  const { rows } = await client.query(
    `UPDATE waivers
        SET status = 'Signed',
            signed_at = CURRENT_TIMESTAMP,
            signed_by = $2,
            signed_by_name = $3,
            signature_name = $4,
            snapshot = $5,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'Issued'
      RETURNING *`,
    [waiverId, signedBy, signedByName, signatureName, snapshot],
  );
  return rows[0] ?? null;
};

export const listWaiverVersionRows = async (waiverId) => {
  const { rows } = await pool.query(
    `SELECT * FROM waiver_versions
      WHERE waiver_id = $1
      ORDER BY version DESC`,
    [waiverId],
  );
  return rows;
};
