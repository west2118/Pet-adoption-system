import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Loads backend configuration from `.env.<NODE_ENV>` when that file exists
 * (e.g. `.env.production` on the server) and falls back to `.env` otherwise.
 *
 * Only one file is read: production never inherits a developer's `.env`. The
 * file is resolved from the backend folder, so it works regardless of cwd.
 */
export const loadEnv = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const scoped = path.join(backendRoot, `.env.${nodeEnv}`);
  const fallback = path.join(backendRoot, '.env');
  dotenv.config({ path: fs.existsSync(scoped) ? scoped : fallback });
};
