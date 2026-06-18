import rateLimit from 'express-rate-limit';
import { hasRedis, redis } from '../config/redis.js';
import RedisStore from 'rate-limit-redis';
import { config } from '../config/index.js';

function makeStore(): import('express-rate-limit').Store | undefined {
  if (hasRedis() && redis) {
    const store = new RedisStore({
      sendCommand: (...args: string[]) => (redis as any).call(...args),
    });
    return store as any;
  }
  return undefined;
}

export const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(),
  message: { error: true, code: 'RATE_LIMITED', message: 'Too many auth attempts, try again later.' },
});

export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.apiWindowMs,
  max: config.rateLimit.apiMax,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(),
  message: { error: true, code: 'RATE_LIMITED', message: 'Too many requests, slow down.' },
});
