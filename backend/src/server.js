import { createApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/database.js';
import { assertDatabaseUrl } from './config/pgOptions.js';
import { logger } from './utils/logger.js';
import { ensurePlatformAdmin } from '../scripts/seedAdmin.js';

const start = async () => {
  // Fails fast with a clear message when DATABASE_URL still points at a local
  // PostgreSQL server or an unsupported provider.
  assertDatabaseUrl(env.DATABASE_URL);

  // Schema changes are manual: run `npm run migrate` before starting the API.

  logger.info('Ensuring developer platform admin user...');
  await ensurePlatformAdmin(pool);

  logger.info('Database connection verified.');

  const app = createApp();

  // Render (and most PaaS hosts) only detect an open port when the server
  // listens on 0.0.0.0, not on the localhost interface.
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`API listening on 0.0.0.0:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down.`);
    server.close(() => pool.end().finally(() => process.exit(0)));
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
