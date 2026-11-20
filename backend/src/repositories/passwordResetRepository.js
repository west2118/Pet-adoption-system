import { pool } from '../config/database.js';

export const createPasswordReset = async ({ userId, email, otpHash, expiresAt }) => {
  // Only the newest request for an account stays valid.
  await pool.query('DELETE FROM password_resets WHERE user_id = $1', [userId]);

  const { rows } = await pool.query(
    `INSERT INTO password_resets (user_id, email, otp_hash, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, email, otpHash, expiresAt],
  );
  return rows[0];
};

export const findPasswordResetById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM password_resets WHERE id = $1', [id]);
  return rows[0] ?? null;
};

export const recordPasswordResetAttempt = async (id) => {
  const { rows } = await pool.query(
    `UPDATE password_resets
        SET attempts = attempts + 1
      WHERE id = $1
      RETURNING *`,
    [id],
  );
  return rows[0] ?? null;
};

export const deletePasswordReset = async (id) => {
  await pool.query('DELETE FROM password_resets WHERE id = $1', [id]);
};
