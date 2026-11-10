import { fileURLToPath } from 'node:url';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { loadEnv } from '../src/config/loadEnv.js';
import { buildPgConfig } from '../src/config/pgOptions.js';

loadEnv();

export const ensurePlatformAdmin = async (existingPool) => {
  const isProduction = process.env.NODE_ENV === 'production';
  // The server seeds this account on every boot. Never fall back to a known
  // default password in production — an unset ADMIN_PASSWORD skips the seed.
  const adminPassword =
    process.env.ADMIN_PASSWORD || (isProduction ? '' : 'password123');

  if (!adminPassword) {
    // eslint-disable-next-line no-console
    console.warn(
      '[Seed] ADMIN_PASSWORD is not set; skipping platform admin creation in production.',
    );
    return;
  }

  const pool =
    existingPool || new pg.Pool(buildPgConfig(process.env.DATABASE_URL));

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@pawsandhomes.ph';
  const adminName = process.env.ADMIN_NAME || 'Platform Admin';

  try {
    const res = await pool.query(
      "SELECT id FROM users WHERE role = 'platform_admin' OR email = $1 LIMIT 1",
      [adminEmail]
    );

    if (res.rowCount === 0) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role, account_status)
         VALUES ($1, $2, $3, 'platform_admin', 'approved')`,
        [adminName, adminEmail, passwordHash]
      );
      // eslint-disable-next-line no-console
      console.log(
        isProduction
          ? `[Seed] Platform Admin created: ${adminEmail}`
          : `[Seed] Developer Platform Admin created: ${adminEmail} / ${adminPassword}`,
      );
    } else {
      // eslint-disable-next-line no-console
      console.log(`[Seed] Developer Platform Admin already exists (${adminEmail}).`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Seed] Error ensuring platform admin:', err);
    throw err;
  } finally {
    if (!existingPool) {
      await pool.end();
    }
  }
};

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  ensurePlatformAdmin().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}
