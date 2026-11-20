import { pool } from '../config/database.js';

export const createSignupVerification = async ({
  name,
  email,
  passwordHash,
  role = 'adopter',
  otpHash,
  expiresAt,
}) => {
  // Clear any previous pending signup attempts for this email
  await pool.query('DELETE FROM signup_verifications WHERE email = $1', [email]);

  const { rows } = await pool.query(
    `INSERT INTO signup_verifications (name, email, password_hash, role, otp_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, email, passwordHash, role, otpHash, expiresAt],
  );
  return rows[0];
};

export const findSignupVerificationById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM signup_verifications WHERE id = $1', [id]);
  return rows[0] ?? null;
};

export const recordSignupVerificationAttempt = async (id) => {
  const { rows } = await pool.query(
    `UPDATE signup_verifications
        SET attempts = attempts + 1
      WHERE id = $1
      RETURNING *`,
    [id],
  );
  return rows[0] ?? null;
};

export const deleteSignupVerification = async (id) => {
  await pool.query('DELETE FROM signup_verifications WHERE id = $1', [id]);
};
