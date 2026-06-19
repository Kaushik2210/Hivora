import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { config } from './config/index.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { orgRouter } from './routes/organizations.js';
import { createProjectRouter } from './routes/projects.js';
import { createLockRouter } from './routes/locks.js';
import { agentRouter } from './routes/agents.js';
import { userRouter } from './routes/user.js';
import { createRealtimeServer } from './realtime/index.js';
import { notFoundHandler, errorHandler } from './middleware/error.js'
import { contactRouter } from './routes/contact.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { hasRedis } from './config/redis.js';
import { startEmailWorker } from './jobs/worker.js';

const _candidateDirs = [
  path.join(process.cwd(), '../web/public'),
  path.join(process.cwd(), 'apps/web/public'),
]
const _webPublicDir = _candidateDirs.find(d => fs.existsSync(d)) ?? _candidateDirs[0]

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
app.use('/api/agents', apiLimiter, agentRouter)
app.use('/api/user', apiLimiter, userRouter)
app.use('/api/contact', apiLimiter, contactRouter);

app.get('/downloads/windows', (_req, res) => {
  const filePath = path.join(_webPublicDir, 'Hivora-Setup-0.1.0.exe')
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Installer not found' })
    return
  }
  res.download(filePath, 'Hivora-Setup-0.1.0.exe')
})

app.use(notFoundHandler);
app.use(errorHandler);

const worker = startEmailWorker();

import { startAgentSimulation } from './services/agent.service.js';

httpServer.listen(config.port, () => {
  console.log(`\n  Hivora API listening on http://localhost:${config.port}`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  Redis: ${hasRedis() ? 'configured' : 'not configured (in-memory)'}`);
  console.log(`  Email: ${config.email.provider}`);
  console.log(`  CORS: ${config.corsOrigins.join(', ')}\n`);
  
  // Start simulation motor
  startAgentSimulation();
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
