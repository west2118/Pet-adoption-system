import pg from 'pg';
import { env } from './env.js';
import { buildPgConfig } from './pgOptions.js';

const { Pool } = pg;

// Adds TLS automatically for managed hosts (Supabase), plain TCP for local Postgres.
export const pool = new Pool(buildPgConfig(env.DATABASE_URL));

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected pg pool error', err);
});

export const query = async (text, params) => pool.query(text, params);
