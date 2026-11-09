import { pool } from '../config/database.js';

/**
 * Allowed status transitions for a visit request. A shelter approves by
 * confirming (optionally with a slot) and declines by cancelling. Terminal
 * states (`completed`, `cancelled`) accept no further moves.
 */
export const VISIT_TRANSITIONS = {
  requested: ['confirmed', 'cancelled'],
  // Confirmed can be confirmed again: the shelter may reschedule and send the
  // adopter a new date/message.
  confirmed: ['confirmed', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const THREAD_WITH_PET = `
  SELECT t.*, p.shelter_id, p.name AS pet_name, p.image_url AS pet_image,
         u.name AS adopter_name, u.email AS adopter_email,
         TO_CHAR(t.confirmed_for, 'YYYY-MM-DD"T"HH24:MI') AS confirmed_for_local
    FROM visit_threads t
    JOIN pets p ON p.id = t.pet_id
    JOIN users u ON u.id = t.adopter_id
`;

export const findThreadById = async (id) => {
  const { rows } = await pool.query(`${THREAD_WITH_PET} WHERE t.id = $1`, [id]);
  return rows[0] ?? null;
};

/**
 * One request per (pet, adopter), regardless of status — a cancelled or
 * completed visit still counts, so the adopter cannot re-request the same pet.
 */
export const findThreadByPetAndAdopter = async (petId, adopterId) => {
  const { rows } = await pool.query(
    `${THREAD_WITH_PET} WHERE t.pet_id = $1 AND t.adopter_id = $2`,
    [petId, adopterId],
  );
  return rows[0] ?? null;
};

export const createThread = async ({ petId, adopterId, preferredSlot, reason }) => {
  const { rows } = await pool.query(
    `INSERT INTO visit_threads (pet_id, adopter_id, status, preferred_slot, reason)
     VALUES ($1, $2, 'requested', $3, $4) RETURNING *`,
    [petId, adopterId, preferredSlot, reason ?? null],
  );
  return rows[0] ?? null;
};

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
 * Status counters across ALL of an adopter's visit requests — the summary
 * band has to stay correct while the list itself is paged.
 */
export const getVisitSummaryByAdopter = async (adopterId) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'requested')::int AS requested,
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
    confirmed: row.confirmed,
    completed: row.completed,
    cancelled: row.cancelled,
  };
};

/** Total visit requests received by one shelter (all statuses). */
export const countThreadsByShelter = async (shelterId) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total
       FROM visit_threads t
       JOIN pets p ON p.id = t.pet_id
      WHERE p.shelter_id = $1`,
    [shelterId],
  );
  return rows[0].total;
};

/** Deletes selected visit requests that belong to the shelter's pets. */
export const deleteThreadsByIds = async (ids, shelterId) => {
  const { rows } = await pool.query(
    `DELETE FROM visit_threads t
      USING pets p
      WHERE t.pet_id = p.id
        AND t.id = ANY($1::uuid[])
        AND p.shelter_id = $2
      RETURNING t.id`,
    [ids, shelterId],
  );
  return rows.map((row) => row.id);
};

export const listThreadsByShelter = async (
  shelterId,
  { limit = 10, offset = 0, status, search } = {},
) => {
  const conditions = ['p.shelter_id = $1'];
  const values = [shelterId];
  if (status && status !== 'all') {
    values.push(status);
    conditions.push(`t.status = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    conditions.push(
      `(p.name ILIKE $${values.length} OR u.name ILIKE $${values.length} OR u.email ILIKE $${values.length})`,
    );
  }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const { rows } = await pool.query(
    `${THREAD_WITH_PET} ${where} ORDER BY t.updated_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset],
  );
  const count = await pool.query(
    `SELECT COUNT(*)::int AS total FROM visit_threads t
      JOIN pets p ON p.id = t.pet_id
      JOIN users u ON u.id = t.adopter_id ${where}`,
    values,
  );
  return { rows, total: count.rows[0].total };
};

export const updateThreadStatus = async (
  threadId,
  { status, confirmedSlot, confirmedFor, cancelReason, message },
) => {
  const { rows } = await pool.query(
    `UPDATE visit_threads
        SET status = $2::visit_thread_status,
            confirmed_slot = COALESCE($3, confirmed_slot),
            confirmed_for = CASE
              WHEN $2::visit_thread_status = 'confirmed'
                THEN COALESCE($6::timestamp, confirmed_for)
              ELSE confirmed_for
            END,
            cancel_reason = CASE WHEN $2::visit_thread_status = 'cancelled' THEN $4 ELSE NULL END,
            shelter_message = COALESCE($5, shelter_message),
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *, TO_CHAR(confirmed_for, 'YYYY-MM-DD"T"HH24:MI') AS confirmed_for_local`,
    [
      threadId,
      status,
      confirmedSlot ?? null,
      cancelReason ?? null,
      message ?? null,
      confirmedFor ?? null,
    ],
  );
  return rows[0] ?? null;
};
