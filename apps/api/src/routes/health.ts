import { Router } from 'express';
import { ok } from '../utils/response.js';
import { hasRedis } from '../config/redis.js';
import { prisma } from '@hivora/db';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }
  res.json(ok({
    status: 'ok',
    service: 'hivora-api',
    database: dbOk ? 'connected' : 'disconnected',
    redis: hasRedis() ? 'connected' : 'not-configured',
    timestamp: new Date().toISOString(),
  }));
});
