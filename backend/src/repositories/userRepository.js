import { pool } from '../config/database.js';

export const findUserByEmail = async (email) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] ?? null;
};

export const findUserById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
};

export const createUser = async ({ name, email, passwordHash, role = 'adopter', shelterId = null }) => {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, shelter_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, email, passwordHash, role, shelterId],
  );
  return rows[0];
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
