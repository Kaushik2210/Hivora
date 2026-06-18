import Redis from 'ioredis';
import { config } from '../config/index.js';

function buildRedisUrl(): string | undefined {
  if (config.redis.url) return config.redis.url;
  if (config.redis.host) {
    const auth = config.redis.password ? `:${config.redis.password}@` : '';
    const tls = config.redis.tls ? 'rediss' : 'redis';
    return `${tls}://${auth}${config.redis.host}:${config.redis.port}`;
  }
  return undefined;
}

const url = buildRedisUrl();

export const redis: Redis | null = url
  ? new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    })
  : null;

if (redis) {
  redis.on('error', (err) => console.error('[Redis] error:', err.message));
  redis.on('connect', () => console.log('[Redis] connected'));
}

export function getRedis(): Redis {
  if (!redis) {
    throw new Error('Redis is not configured. Set REDIS_URL or REDIS_HOST.');
  }
  return redis;
}

export function hasRedis(): boolean {
  return redis !== null;
}
