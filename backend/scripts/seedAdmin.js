import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';

dotenv.config();

export const ensurePlatformAdmin = async (existingPool) => {
  const pool = existingPool || new pg.Pool({ connectionString: process.env.DATABASE_URL });
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@pawsandhomes.ph';
  const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
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
      console.log(`[Seed] Developer Platform Admin created: ${adminEmail} / ${adminPassword}`);
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
