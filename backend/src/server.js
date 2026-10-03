import { createApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/database.js';
import { logger } from './utils/logger.js';

const start = async () => {
  await pool.query('SELECT 1');
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
