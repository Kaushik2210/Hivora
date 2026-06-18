import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config/index.js';

export const EMAIL_QUEUE = 'email';

export interface EmailJobData {
  to: string;
  template: 'welcome' | 'verify-email' | 'password-reset' | 'invite';
  payload: Record<string, string>;
}

let queue: Queue<EmailJobData> | null = null;

function buildRedisUrl(): string | undefined {
  if (config.redis.url) return config.redis.url;
  if (config.redis.host) {
    const auth = config.redis.password ? `:${config.redis.password}@` : '';
    const tls = config.redis.tls ? 'rediss' : 'redis';
    return `${tls}://${auth}${config.redis.host}:${config.redis.port}`;
  }
  return undefined;
}

function createConnection(): IORedis | null {
  const url = buildRedisUrl();
  if (!url) return null;
  return new IORedis(url, { maxRetriesPerRequest: 3 });
}

export function getEmailQueue(): Queue<EmailJobData> {
  if (!queue) {
    const connection = createConnection();
    if (!connection) {
      throw new Error('Redis required for job queue');
    }
    queue = new Queue<EmailJobData>(EMAIL_QUEUE, {
      connection: connection as any,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
  }
  return queue;
}

export async function enqueueEmail(data: EmailJobData): Promise<void> {
  const url = buildRedisUrl();
  if (!url) {
    console.warn('[Queue] Redis unavailable, email will not be queued. Job:', data);
    return;
  }
  const q = getEmailQueue();
  await q.add(data.template, data);
}
