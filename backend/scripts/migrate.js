import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { loadEnv } from '../src/config/loadEnv.js';
import { buildPgConfig, isManagedDatabase } from '../src/config/pgOptions.js';

loadEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '..', 'migrations');

/** Loggable target without credentials. */
const describeDatabase = (dbUrl) => {
  try {
    const url = new URL(dbUrl);
    return `${url.hostname}:${url.port || '5432'}${url.pathname}`;
  } catch {
    return 'unknown database';
  }
};

/**
 * Creates a local database when it does not exist yet. Managed providers
 * (Supabase, Neon, …) hand you exactly one database and do not let the app
 * role create more, so this is a no-op there.
 */
export const ensureDatabaseExists = async (dbUrl) => {
  if (isManagedDatabase(dbUrl)) return;

  try {
    const url = new URL(dbUrl);
    const dbName = url.pathname.slice(1);
    if (!dbName) return;

    const systemUrl = new URL(dbUrl);
    systemUrl.pathname = '/postgres';

    const client = new pg.Client(buildPgConfig(systemUrl.toString()));
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

/**
 * Applies every SQL file in `migrations/` in filename order.
 *
 * The files are idempotent by design (the migrator keeps no tracking table), and
 * each one runs inside its own transaction so a failed or interrupted run never
 * leaves a half-applied migration behind.
 */
export const runMigrations = async (existingPool) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is required to run migrations.');
  }
  try {
    new URL(dbUrl);
  } catch {
    throw new Error(
      'DATABASE_URL is not a valid connection string. Fill in the Supabase session pooler URI (database password and region, no square brackets) in backend/.env.production.',
    );
  }

  if (!existingPool) {
    await ensureDatabaseExists(dbUrl);
  }

  const pool = existingPool || new pg.Pool(buildPgConfig(dbUrl));
  const managed = isManagedDatabase(dbUrl);
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  // eslint-disable-next-line no-console
  console.log(
    `Migrating ${describeDatabase(dbUrl)}${managed ? ' (managed Postgres, TLS)' : ''}...`,
  );

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    // eslint-disable-next-line no-console
    console.log(`Applying ${file}...`);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      const failure = new Error(`Migration ${file} failed: ${err.message}`);
      failure.cause = err;
      throw failure;
    } finally {
      client.release();
    }
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
