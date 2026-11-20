import { z } from 'zod';
import { loadEnv } from './loadEnv.js';

// NODE_ENV=production loads `.env.production`; everything else loads `.env`.
loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .default('3000')
    .transform((val) => Number(val))
    .pipe(z.number().int().positive()),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z
    .string()
    .default('587')
    .transform((val) => Number(val))
    .pipe(z.number().int().positive()),
  SMTP_SECURE: z
    .string()
    .default('false')
    .transform((val) => val === 'true' || val === '1'),
  SMTP_USER: z.string().optional(),
  EMAIL_PROVIDER: z.enum(['auto', 'brevo', 'smtp']).default('auto'),
  BREVO_API_KEY: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  APP_URL: z.string().optional(),
  // Supabase Storage for pet photos and shelter logos. SUPABASE_URL is derived
  // from DATABASE_URL when omitted; the service role key is required to write.
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default('paws-images'),
});

export const env = envSchema.parse(process.env);

export const allowedOrigins = env.ALLOWED_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isLoopbackOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(origin);

const configuredAppUrl = env.APP_URL?.trim().replace(/\/+$/, '');
const deployedOrigin = allowedOrigins.find((origin) => !isLoopbackOrigin(origin));

// A localhost APP_URL copied from .env.example can only be right on a dev
// machine, so production ignores it rather than emailing unusable links.
const useConfigured =
  configuredAppUrl &&
  !(env.NODE_ENV === 'production' && isLoopbackOrigin(configuredAppUrl));

/**
 * Public origin of the deployed app. Emailed buttons always open this root
 * (never a deep link like /applications), so a host that does not rewrite SPA
 * routes — or an adopter who is signed out — can never land on a broken page.
 * In production it is authoritative, so a stale APP_URL cannot misdirect mail.
 */
export const deployedSiteUrl = 'https://pet-adoption-system-p2cx.onrender.com';

/**
 * Origin used in emailed links (sign-in buttons, application links).
 * Production always uses `deployedSiteUrl`; development prefers APP_URL and
 * falls back to the first deployed origin in ALLOWED_ORIGINS, then localhost.
 */
export const appUrl =
  env.NODE_ENV === 'production'
    ? deployedSiteUrl
    : useConfigured
      ? configuredAppUrl
      : deployedOrigin || 'http://localhost:5173';
