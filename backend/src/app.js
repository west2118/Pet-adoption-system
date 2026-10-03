import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { allowedOrigins } from './config/env.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { apiRouter } from './routes/index.js';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));

  app.use('/api/', apiLimiter);
  app.use('/api/v1', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
