import { createApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/database.js';
import { logger } from './utils/logger.js';
import { runMigrations } from '../scripts/migrate.js';
import { ensurePlatformAdmin } from '../scripts/seedAdmin.js';

const start = async () => {
  logger.info('Ensuring database schema and migrations...');
  await runMigrations(pool);

  logger.info('Ensuring developer platform admin user...');
  await ensurePlatformAdmin(pool);

  logger.info('Database connection verified.');

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
};

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

