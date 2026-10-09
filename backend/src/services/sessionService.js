import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { mapUser } from '../utils/mappers.js';
import { findUserById } from '../repositories/userRepository.js';

export const ACCESS_COOKIE = 'paws_at';
export const REFRESH_COOKIE = 'paws_rt';

/** Parses '15m', '1h', '7d', '30s', '500ms', '2w' into milliseconds. */
export const parseDurationMs = (raw) => {
  const match = /^(\d+)(ms|s|m|h|d|w)$/.exec(String(raw).trim());
  if (!match) throw new AppError(`Invalid duration '${raw}'.`, 500);
  const value = Number(match[1]);
  const unit = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 }[match[2]];
  return value * unit;
};

export const accessTokenTtlMs = () => parseDurationMs(env.ACCESS_TOKEN_EXPIRES_IN);
export const refreshTokenTtlMs = () => parseDurationMs(env.REFRESH_TOKEN_EXPIRES_IN);

export const signAccessToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      shelterId: user.shelter_id ?? undefined,
      scope: 'full',
    },
    env.JWT_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN },
  );

const hashRefreshToken = (token) =>
  crypto.createHash('sha256').update(token, 'utf8').digest('hex');

/**
 * Mints a fresh session: short-lived access JWT + opaque refresh token whose
 * hash is persisted. Returns both raw values (refresh is only ever handed to
 * the httpOnly cookie setter, never to a response body).
 */
export const issueSession = async (userRow) => {
  const accessToken = signAccessToken(userRow);
  const refreshToken = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + refreshTokenTtlMs());
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userRow.id, hashRefreshToken(refreshToken), expiresAt],
  );
  return { accessToken, refreshToken };
};

/**
 * Rotates a session: the presented refresh token is consumed (deleted) and a
 * new pair is issued atomically. Unknown or expired tokens are rejected, and
 * visibly expired rows are swept to keep the table small.
 */
export const rotateSession = async (presentedToken) => {
  if (!presentedToken) {
    throw new AppError('Authentication required. Missing refresh token.', 401);
  }
  await pool.query('DELETE FROM refresh_tokens WHERE expires_at <= CURRENT_TIMESTAMP');
  const { rows } = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1',
    [hashRefreshToken(presentedToken)],
  );
  const record = rows[0];
  if (!record) {
    throw new AppError('Invalid or expired session. Please log in again.', 401);
  }
  const userRow = await findUserById(record.user_id);
  if (!userRow) {
    throw new AppError('User not found.', 404);
  }
  if (userRow.account_status === 'rejected' || userRow.account_status === 'suspended') {
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userRow.id]);
    throw new AppError('Your account is not active. Please contact support.', 403);
  }
  await pool.query('DELETE FROM refresh_tokens WHERE id = $1', [record.id]);
  const tokens = await issueSession(userRow);
  return { user: mapUser(userRow), ...tokens };
};

/** Revokes the presented session (best-effort — logout must always succeed). */
export const revokeSession = async (presentedToken) => {
  if (!presentedToken) return 0;
  const { rowCount } = await pool.query(
    'DELETE FROM refresh_tokens WHERE token_hash = $1',
    [hashRefreshToken(presentedToken)],
  );
  return rowCount;
};

const cookieFlags = (maxAge) => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge,
});

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(ACCESS_COOKIE, accessToken, cookieFlags(accessTokenTtlMs()));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieFlags(refreshTokenTtlMs()));
};

export const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
};

/** Minimal cookie reader — avoids a cookie-parser dependency. */
export const getCookie = (req, name) => {
  const header = req.headers?.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      try {
        return decodeURIComponent(part.slice(idx + 1).trim());
      } catch {
        return part.slice(idx + 1).trim();
      }
    }
  }
  return undefined;
};
