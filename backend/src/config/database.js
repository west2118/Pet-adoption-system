import pg from 'pg';
import { env } from './env.js';
import { buildPgConfig } from './pgOptions.js';

const { Pool } = pg;

// Supabase is the only database. TLS, pooler limits and connection timeouts
// come from pgOptions.js so the API, migrations and seeds behave identically.
export const pool = new Pool(buildPgConfig(env.DATABASE_URL));

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected pg pool error', err);
});

export const query = async (text, params) => pool.query(text, params);
