import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import http from 'http';
import { config } from './config/index.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { orgRouter } from './routes/organizations.js';
import { createProjectRouter } from './routes/projects.js';
import { createLockRouter } from './routes/locks.js';
import { agentRouter } from './routes/agents.js';
import { createRealtimeServer } from './realtime/index.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { hasRedis } from './config/redis.js';
import { startEmailWorker } from './jobs/worker.js';

const app = express();
const httpServer = http.createServer(app);
const io = createRealtimeServer(httpServer);

app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser() as unknown as import('express').RequestHandler);

app.get('/', (_req, res) => {
  res.json({ name: 'Hivora API', version: '0.1.0', docs: '/api/health' });
});

app.use('/api/health', healthRouter);

app.use('/api/auth', apiLimiter, authRouter);
app.use('/api', apiLimiter, orgRouter);
app.use('/api', apiLimiter, createProjectRouter(io));
app.use('/api', apiLimiter, createLockRouter(io));
app.use('/api/agents', apiLimiter, agentRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const worker = startEmailWorker();

httpServer.listen(config.port, () => {
  console.log(`\n  Hivora API listening on http://localhost:${config.port}`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  Redis: ${hasRedis() ? 'configured' : 'not configured (in-memory)'}`);
  console.log(`  Email: ${config.email.provider}`);
  console.log(`  CORS: ${config.corsOrigins.join(', ')}\n`);
});

function shutdown(signal: string) {
  console.log(`\n[${signal}] shutting down...`);
  httpServer.close(() => {
    io.close(() => {
      worker?.close().finally(() => {
        process.exit(0);
      });
    });
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app, httpServer, io };
