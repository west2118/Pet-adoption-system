import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected pg pool error', err);
});

export const query = async (text, params) => pool.query(text, params);
