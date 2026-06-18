import dotenv from 'dotenv';

dotenv.config();

function required(key: string, fallback?: string): string {
  const val = process.env[key] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return val;
}

function int(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
}

function bool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return v === 'true' || v === '1';
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: int('PORT', 4000),

  appUrl: required('APP_URL', 'http://localhost:3000'),
  apiBaseUrl: required('API_BASE_URL', 'http://localhost:4000'),
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:5173').split(',').map((s) => s.trim()),

  jwt: {
    secret: required('JWT_SECRET', 'dev-super-secret-change-in-production-min-32-chars'),
    accessTtl: int('JWT_ACCESS_TTL', 900),
    refreshTtl: int('JWT_REFRESH_TTL', 60 * 60 * 24 * 30),
  },

  bcrypt: {
    rounds: int('BCRYPT_ROUNDS', 12),
  },

  redis: {
    url: process.env.REDIS_URL || undefined,
    host: process.env.REDIS_HOST || undefined,
    port: int('REDIS_PORT', 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: bool('REDIS_TLS', false),
  },

  email: {
    provider: process.env.EMAIL_PROVIDER ?? 'console',
    resendApiKey: process.env.RESEND_API_KEY || undefined,
    from: process.env.EMAIL_FROM ?? 'no-reply@hivora.local',
    replyTo: process.env.EMAIL_REPLY_TO ?? 'support@hivora.local',
  },

  billing: {
    enabled: bool('BILLING_ENABLED', false),
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || undefined,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || undefined,
  },

  rateLimit: {
    authWindowMs: int('RATE_LIMIT_AUTH_WINDOW_MS', 15 * 60 * 1000),
    authMax: int('RATE_LIMIT_AUTH_MAX', 10),
    apiWindowMs: int('RATE_LIMIT_API_WINDOW_MS', 60 * 1000),
    apiMax: int('RATE_LIMIT_API_MAX', 120),
  },
} as const;

export type AppConfig = typeof config;
