import { pool } from '../config/database.js';

/**
 * Allowed status transitions for a visit thread. Terminal states
 * (`completed`, `cancelled`) accept no further moves.
 */
export const VISIT_TRANSITIONS = {
  requested: ['proposed', 'confirmed', 'cancelled'],
  proposed: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export const findThreadById = async (id) => {
  const { rows } = await pool.query(
    `SELECT t.*, p.shelter_id FROM visit_threads t
      JOIN pets p ON p.id = t.pet_id WHERE t.id = $1`,
    [id],
  );
  return rows[0] ?? null;
};

export const findOpenThread = async (petId, adopterId) => {
  const { rows } = await pool.query(
    `SELECT * FROM visit_threads
      WHERE pet_id = $1 AND adopter_id = $2
        AND status IN ('requested', 'proposed', 'confirmed')`,
    [petId, adopterId],
  );
  return rows[0] ?? null;
};

export const createThread = async ({ petId, adopterId, preferredSlot, message }, senderId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO visit_threads (pet_id, adopter_id, status, preferred_slot)
       VALUES ($1, $2, 'requested', $3) RETURNING *`,
      [petId, adopterId, preferredSlot],
    );
    await client.query(
      `INSERT INTO visit_messages (thread_id, sender_id, body) VALUES ($1, $2, $3)`,
      [rows[0].id, senderId, message],
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const THREAD_WITH_PET = `
  SELECT t.*, p.shelter_id, p.name AS pet_name, p.image_url AS pet_image
    FROM visit_threads t JOIN pets p ON p.id = t.pet_id
`;

export const listThreadsByAdopter = async (adopterId, { limit = 10, offset = 0, status } = {}) => {
  const conditions = ['t.adopter_id = $1'];
  const values = [adopterId];
  if (status && status !== 'all') {
    values.push(status);
    conditions.push(`t.status = $${values.length}`);
  }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const { rows } = await pool.query(
    `${THREAD_WITH_PET} ${where} ORDER BY t.updated_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset],
  );
  const count = await pool.query(
    `SELECT COUNT(*)::int AS total FROM visit_threads t ${where}`,
    values,
  );
  return { rows, total: count.rows[0].total };
};

/**
 * Status counters across ALL of an adopter's visit threads — the summary
 * band has to stay correct while the list itself is paged.
 */
export const getVisitSummaryByAdopter = async (adopterId) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'requested')::int AS requested,
            COUNT(*) FILTER (WHERE status = 'proposed')::int AS proposed,
            COUNT(*) FILTER (WHERE status = 'confirmed')::int AS confirmed,
            COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
            COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled
       FROM visit_threads
      WHERE adopter_id = $1`,
    [adopterId],
  );
  const row = rows[0];
  return {
    total: row.total,
    requested: row.requested,
    proposed: row.proposed,
    confirmed: row.confirmed,
    completed: row.completed,
    cancelled: row.cancelled,
  };
};

export const listThreadsByShelter = async (shelterId, { limit = 10, offset = 0, status } = {}) => {
  const conditions = ['p.shelter_id = $1'];
  const values = [shelterId];
  if (status && status !== 'all') {
    values.push(status);
    conditions.push(`t.status = $${values.length}`);
  }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const { rows } = await pool.query(
    `${THREAD_WITH_PET} ${where} ORDER BY t.updated_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset],
  );
  const count = await pool.query(
    `SELECT COUNT(*)::int AS total FROM visit_threads t
      JOIN pets p ON p.id = t.pet_id ${where}`,
    values,
  );
  return { rows, total: count.rows[0].total };
};

export const listThreadMessages = async (threadId) => {
  const { rows } = await pool.query(
    `SELECT m.*, u.name AS sender_name, u.role AS sender_role
       FROM visit_messages m JOIN users u ON u.id = m.sender_id
      WHERE m.thread_id = $1 ORDER BY m.created_at ASC`,
    [threadId],
  );
  return rows;
};

export const createMessage = async (threadId, senderId, body) => {
  const { rows } = await pool.query(
    `INSERT INTO visit_messages (thread_id, sender_id, body)
     VALUES ($1, $2, $3) RETURNING *`,
    [threadId, senderId, body],
  );
  await pool.query(
    'UPDATE visit_threads SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [threadId],
  );
  return rows[0];
};

export const updateThreadStatus = async (threadId, { status, confirmedSlot, cancelReason }) => {
  const { rows } = await pool.query(
    `UPDATE visit_threads
        SET status = $2,
            confirmed_slot = COALESCE($3, confirmed_slot),
            cancel_reason = CASE WHEN $2 = 'cancelled' THEN $4 ELSE NULL END,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 RETURNING *`,
    [threadId, status, confirmedSlot ?? null, cancelReason ?? null],
  );
  return rows[0] ?? null;
};
