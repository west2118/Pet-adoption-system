import { pool } from '../config/database.js';

export const findUserByEmail = async (email) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] ?? null;
};

export const findUserById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
};

export const createUser = async ({
  name,
  email,
  passwordHash,
  role = 'adopter',
  shelterId = null,
  accountStatus = 'approved',
  isOwner = false,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, shelter_id, account_status, is_owner)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [name, email, passwordHash, role, shelterId, accountStatus, isOwner],
  );
  return rows[0];
};

// Promotes a pending shelter registrant to the approved owner of a shelter.
export const approveUserAsOwner = async (client, { userId, shelterId }) => {
  const { rows } = await client.query(
    `UPDATE users
       SET role = 'shelter_staff', shelter_id = $2, is_owner = true,
           account_status = 'approved', reviewed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 RETURNING *`,
    [userId, shelterId],
  );
  return rows[0] ?? null;
};

export const setUserAccountStatus = async (id, accountStatus, reviewNote = null) => {
  const { rows } = await pool.query(
    `UPDATE users
       SET account_status = $2, review_note = $3, reviewed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 RETURNING *`,
    [id, accountStatus, reviewNote],
  );
  return rows[0] ?? null;
};

export const listUsers = async ({ limit = 50, offset = 0 } = {}) => {
  const { rows } = await pool.query(
    'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset],
  );
  const count = await pool.query('SELECT COUNT(*)::int AS total FROM users');
  return { rows, total: count.rows[0].total };
};

export const updateUserRole = async (id, role, shelterId = null) => {
  const { rows } = await pool.query(
    `UPDATE users SET role = $1, shelter_id = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 RETURNING *`,
    [role, shelterId, id],
  );
  return rows[0] ?? null;
};
