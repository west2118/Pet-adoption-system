import { pool } from '../config/database.js';

export const createLoginChallenge = async ({
  userId,
  otpHash,
  ipAddress,
  city = null,
  country = null,
  clientLocation = null,
  latitude = null,
  longitude = null,
  expiresAt,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO login_challenges
       (user_id, otp_hash, ip_address, city, country, client_location, latitude, longitude, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [userId, otpHash, ipAddress, city, country, clientLocation, latitude, longitude, expiresAt],
  );
  return rows[0];
};

export const findLoginChallengeById = async (challengeId) => {
  const { rows } = await pool.query(
    `SELECT c.*, u.email, u.name, u.role
       FROM login_challenges c
       JOIN users u ON u.id = c.user_id
      WHERE c.id = $1`,
    [challengeId],
  );
  return rows[0] ?? null;
};

export const recordChallengeAttempt = async (challengeId) => {
  const { rows } = await pool.query(
    `UPDATE login_challenges
        SET attempts = attempts + 1
      WHERE id = $1
      RETURNING *`,
    [challengeId],
  );
  return rows[0] ?? null;
};

export const markChallengeVerified = async (challengeId) => {
  const { rows } = await pool.query(
    `UPDATE login_challenges
        SET verified = true
      WHERE id = $1
      RETURNING *`,
    [challengeId],
  );
  return rows[0] ?? null;
};

export const updateUserLoginLocation = async (userId, { ip, city, country, lat, lon }) => {
  const { rows } = await pool.query(
    `UPDATE users
        SET last_login_ip = $2,
            last_login_city = $3,
            last_login_country = $4,
            last_login_lat = $5,
            last_login_lon = $6,
            last_login_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *`,
    [userId, ip, city, country, lat, lon],
  );
  return rows[0] ?? null;
};
