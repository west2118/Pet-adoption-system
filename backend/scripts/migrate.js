import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '..', 'migrations');

export const ensureDatabaseExists = async (dbUrl) => {
  try {
    const url = new URL(dbUrl);
    const dbName = url.pathname.slice(1);
    if (!dbName) return;

    const systemUrl = new URL(dbUrl);
    systemUrl.pathname = '/postgres';

    const client = new pg.Client({ connectionString: systemUrl.toString() });
    await client.connect();
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      // eslint-disable-next-line no-console
      console.log(`Database "${dbName}" created successfully.`);
    }
    await client.end();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`Database check/creation warning: ${err.message}`);
  }
};

export const runMigrations = async (existingPool) => {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    await ensureDatabaseExists(dbUrl);
  }

  const pool = existingPool || new pg.Pool({ connectionString: dbUrl });
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

  if (!existingPool) {
    await pool.end();
  }
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

