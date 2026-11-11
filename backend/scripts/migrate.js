import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { loadEnv } from '../src/config/loadEnv.js';
import {
  assertSupabaseDatabaseUrl,
  buildPgConfig,
  isSupabaseDatabase,
} from '../src/config/pgOptions.js';

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
 * Applies every SQL file in `migrations/` in filename order.
 *
 * The database itself is provisioned by Supabase, so there is no CREATE DATABASE
 * step: the app only applies schema changes. The files are idempotent by design
 * (the migrator keeps no tracking table), and each one runs inside its own
 * transaction so a failed or interrupted run never leaves a half-applied
 * migration behind.
 */
export const runMigrations = async (existingPool) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is required to run migrations.');
  }

  assertSupabaseDatabaseUrl(dbUrl);

  const pool = existingPool || new pg.Pool(buildPgConfig(dbUrl));
  const supabase = isSupabaseDatabase(dbUrl);
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  // eslint-disable-next-line no-console
  console.log(
    `Migrating ${describeDatabase(dbUrl)}${supabase ? ' (Supabase, TLS)' : ''}...`,
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
    console.error(err.message || err);
    process.exit(1);
  });
}
