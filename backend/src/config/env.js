import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

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
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default('Paws&Homes <onboarding@resend.dev>'),
  APP_URL: z.string().default('http://localhost:5173'),
});

export const env = envSchema.parse(process.env);

export const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
