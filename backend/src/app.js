import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { allowedOrigins, env } from './config/env.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { apiRouter } from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite build output. When it exists (production / Render) this service also
 * serves the SPA, so one Web Service hosts both the app and the API and the
 * frontend needs no separate static host.
 */
const distDir = path.resolve(__dirname, '../../my-project/dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const hasBuiltFrontend = fs.existsSync(indexHtmlPath);

export const createApp = () => {
  const app = express();

  // The defaults block external images and fonts, which the SPA legitimately
  // loads (pet photos from partner/storage hosts, Google Fonts), so those
  // sources are widened instead of turning the policy off.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'connect-src': ["'self'", 'https:'],
          'font-src': ["'self'", 'data:', 'https:'],
          'style-src': ["'self'", "'unsafe-inline'", 'https:'],
        },
      },
    }),
  );
  app.use(
    cors({
      // APP_URL is the deployed origin, so the SPA works even when
      // ALLOWED_ORIGINS was not updated after the first deploy.
      origin: Array.from(new Set([...allowedOrigins, env.APP_URL])),
      credentials: true,
    }),
  );
  // 10mb: shelter staff upload photos as base64 data URLs inside JSON.
  app.use(express.json({ limit: '10mb' }));

  app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
  app.get('/healthz', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));

  app.use('/api/v1', apiRouter);

  if (hasBuiltFrontend) {
    // Vite fingerprints asset filenames, so they can be cached forever; the
    // shell must revalidate so a new deploy is not masked by a stale index.html.
    app.use(
      '/assets',
      express.static(path.join(distDir, 'assets'), {
        immutable: true,
        maxAge: '1y',
      }),
    );
    app.use(express.static(distDir, { index: false, maxAge: '1h' }));

    // Client-side routes (/pets, /shelters/:id, /applications, …) all get the
    // SPA shell. Express 5 rejects a bare '*' route path, so this is path-less
    // middleware that only handles non-API GETs.
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      if (req.path.startsWith('/api/') || req.path.startsWith('/health')) return next();
      res.sendFile(indexHtmlPath);
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
