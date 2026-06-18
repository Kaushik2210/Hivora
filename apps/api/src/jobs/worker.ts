import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config/index.js';
import { EMAIL_QUEUE, type EmailJobData } from './queue.js';
import { getEmailProvider } from '../providers/index.js';
import { brand } from '@hivora/shared';

function buildRedisUrl(): string | undefined {
  if (config.redis.url) return config.redis.url;
  if (config.redis.host) {
    const auth = config.redis.password ? `:${config.redis.password}@` : '';
    const tls = config.redis.tls ? 'rediss' : 'redis';
    return `${tls}://${auth}${config.redis.host}:${config.redis.port}`;
  }
  return undefined;
}

function buildEmailContent(data: EmailJobData): { subject: string; html: string; text: string } {
  const { template, payload } = data;
  const baseUrl = config.appUrl;

  switch (template) {
    case 'verify-email': {
      const link = `${baseUrl}/verify-email?token=${payload.token}`;
      return {
        subject: `Verify your ${brand.displayName} account`,
        text: `Welcome to ${brand.displayName}! Verify your email: ${link}`,
        html: `<h2>Welcome to ${brand.displayName}!</h2><p>Verify your email address:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`,
      };
    }
    case 'password-reset': {
      const link = `${baseUrl}/reset-password?token=${payload.token}`;
      return {
        subject: `Reset your ${brand.displayName} password`,
        text: `Reset your password: ${link}`,
        html: `<h2>Password Reset</h2><p>Reset your password: <a href="${link}">${link}</a></p><p>Expires in 1 hour. If you didn't request this, ignore this email.</p>`,
      };
    }
    case 'invite': {
      const link = `${baseUrl}/invite?token=${payload.token}`;
      return {
        subject: `You're invited to ${brand.displayName}`,
        text: `Join: ${link}`,
        html: `<h2>You're invited!</h2><p>You've been invited to join ${brand.displayName}. Accept: <a href="${link}">${link}</a></p>`,
      };
    }
    case 'welcome':
    default:
      return {
        subject: `Welcome to ${brand.displayName}`,
        text: `Welcome to ${brand.displayName}!`,
        html: `<h2>Welcome to ${brand.displayName}!</h2><p>Your account is ready.</p>`,
      };
  }
}

export function startEmailWorker(): Worker<EmailJobData> | null {
  const url = buildRedisUrl();
  if (!url) {
    console.warn('[Worker] Redis unavailable, email worker not started.');
    return null;
  }

  const provider = getEmailProvider();
  const connection = new IORedis(url, { maxRetriesPerRequest: 3 });

  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE,
    async (job) => {
      const { to, template } = job.data;
      const { subject, html, text } = buildEmailContent(job.data);
      await provider.send({ to, subject, html, text });
      console.log(`[Worker] email sent: ${template} -> ${to}`);
    },
    {
      connection: connection as any,
      concurrency: 5,
    },
  );

  worker.on('failed', (job, err) => {
    console.error(`[Worker] email job failed (${job?.data.template}):`, err.message);
  });

  return worker;
}

if (process.argv[1]?.endsWith('worker.ts') || process.argv[1]?.endsWith('worker.js')) {
  const w = startEmailWorker();
  if (w) {
    console.log('[Worker] email worker started standalone');
    process.on('SIGINT', async () => {
      await w.close();
      process.exit(0);
    });
  }
}
