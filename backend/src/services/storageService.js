import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/**
 * Image storage on Supabase Storage.
 *
 * Uploads go through the backend so the service role key never reaches the
 * browser, and the database only keeps the resulting public URL instead of a
 * multi-megabyte base64 data URL.
 */

const FOLDERS = new Set(['pets', 'shelters']);

/**
 * Derives the project URL from DATABASE_URL so SUPABASE_URL is optional.
 * Handles both the direct host (`db.<ref>.supabase.co`) and the pooler
 * (`aws-…pooler.supabase.com` with user `postgres.<ref>`).
 */
const projectUrlFromDatabaseUrl = () => {
  try {
    const url = new URL(env.DATABASE_URL);
    const direct = url.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
    if (direct) return `https://${direct[1]}.supabase.co`;
    if (/\.pooler\.supabase\.com$/i.test(url.hostname)) {
      const ref = url.username.split('.')[1];
      if (ref) return `https://${ref}.supabase.co`;
    }
    return null;
  } catch {
    return null;
  }
};

export const storageProjectUrl = (env.SUPABASE_URL || projectUrlFromDatabaseUrl() || '').replace(
  /\/+$/,
  '',
);

export const isStorageConfigured = () => Boolean(storageProjectUrl && env.SUPABASE_SERVICE_ROLE_KEY);

const authHeaders = (extra = {}) => ({
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  ...extra,
});

let bucketReady = null;

/** Creates the public bucket on first use so a fresh project needs no manual setup. */
const ensureBucket = async () => {
  if (bucketReady) return bucketReady;
  bucketReady = (async () => {
    const bucket = env.SUPABASE_STORAGE_BUCKET;
    const existing = await fetch(`${storageProjectUrl}/storage/v1/bucket/${bucket}`, {
      headers: authHeaders(),
    });
    if (existing.ok) return;

    const created = await fetch(`${storageProjectUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ id: bucket, name: bucket, public: true }),
    });
    if (!created.ok && created.status !== 409) {
      const body = await created.text().catch(() => '');
      throw new AppError(
        `Could not prepare image storage (${created.status}). ${body}`.trim(),
        502,
      );
    }
  })().catch((error) => {
    bucketReady = null;
    throw error;
  });
  return bucketReady;
};

const EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

const extensionFor = (contentType, originalName = '') => {
  const fromMime = EXTENSIONS[contentType?.toLowerCase()];
  if (fromMime) return fromMime;
  const fromName = originalName.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return fromName && /^(jpe?g|png|webp|gif|avif)$/.test(fromName) ? fromName : 'jpg';
};

/**
 * Stores one image and returns its public URL.
 * @param {{ buffer: Buffer, contentType: string, folder: string, originalName?: string }} file
 */
export const uploadImage = async ({ buffer, contentType, folder, originalName }) => {
  if (!isStorageConfigured()) {
    throw new AppError(
      'Image storage is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server.',
      503,
    );
  }
  if (!FOLDERS.has(folder)) {
    throw new AppError('Unknown upload folder.', 400);
  }

  await ensureBucket();

  const bucket = env.SUPABASE_STORAGE_BUCKET;
  const path = `${folder}/${crypto.randomUUID()}.${extensionFor(contentType, originalName)}`;
  const res = await fetch(`${storageProjectUrl}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: authHeaders({
      'Content-Type': contentType || 'application/octet-stream',
      'x-upsert': 'false',
      'cache-control': 'public, max-age=31536000, immutable',
    }),
    body: buffer,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new AppError(`Image upload failed (${res.status}). ${body}`.trim(), 502);
  }

  return `${storageProjectUrl}/storage/v1/object/public/${bucket}/${path}`;
};

/** Decodes a `data:image/...;base64,...` URL into an upload payload. */
export const parseDataUrl = (dataUrl) => {
  const match = String(dataUrl ?? '').match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) return null;
  return {
    contentType: match[1].toLowerCase(),
    buffer: Buffer.from(match[2], 'base64'),
  };
};
