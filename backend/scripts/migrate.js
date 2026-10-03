import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '..', 'migrations');

export const runMigrations = async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    // eslint-disable-next-line no-console
    console.log(`Applying ${file}...`);
    await pool.query(sql);
  }
  await pool.end();
  // eslint-disable-next-line no-console
  console.log('Migrations complete.');
};

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  runMigrations().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}
