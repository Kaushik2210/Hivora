import { Router } from 'express';
import { prisma } from '@hivora/db';
import { lockSymbolSchema, unlockSymbolSchema } from '@hivora/shared';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/error.js';
import { authRequired } from '../middleware/auth.js';
import { resolveOrgFromProject } from '../middleware/orgGuard.js';
import { ok, fail } from '../utils/response.js';
import type { RealtimeEvent } from '@hivora/shared';
import type { IoServer } from '../realtime/index.js';

export function createLockRouter(io: IoServer): Router {
  const router = Router();

  router.use(authRequired);

  router.get(
    '/projects/:projectId/locks',
    resolveOrgFromProject,
    asyncHandler(async (req, res) => {
      const locks = await prisma.lock.findMany({
        where: { projectId: req.params.projectId },
        orderBy: { lockedAt: 'desc' },
      });
      res.json(ok(
        locks.map((l) => ({
          id: l.id,
          projectId: l.projectId,
          file: l.file,
          symbol: l.symbol,
          agentId: l.agentId,
          lockedAt: l.lockedAt.toISOString(),
        })),
      ));
    }),
  );

  router.post(
    '/projects/:projectId/locks/lock',
    resolveOrgFromProject,
    validate(lockSymbolSchema),
    asyncHandler(async (req, res) => {
      const { file, symbol, agentId } = req.body;
      const projectId = req.params.projectId;

      const existing = await prisma.lock.findUnique({
        where: {
          projectId_file_symbol: { projectId, file, symbol },
        },
      });

      if (existing) {
        if (existing.agentId === agentId) {
          res.json(ok({
            id: existing.id,
            projectId: existing.projectId,
            file: existing.file,
            symbol: existing.symbol,
            agentId: existing.agentId,
            lockedAt: existing.lockedAt.toISOString(),
          }));
          return;
        }
        res.status(409).json(fail('LOCK_CONFLICT', `Conflict! Locked by ${existing.agentId}.`));
        return;
      }

      const lock = await prisma.lock.create({
        data: { projectId, file, symbol, agentId },
      });

      const event: RealtimeEvent = {
        type: 'lock:acquired',
        payload: { id: lock.id, file: lock.file, symbol: lock.symbol, agentId: lock.agentId, projectId },
        organizationId: req.orgId!,
        projectId,
      };
      io.to(`org:${req.orgId}`).to(`project:${projectId}`).emit('event', event);

      res.status(201).json(ok({
        id: lock.id,
        projectId: lock.projectId,
        file: lock.file,
        symbol: lock.symbol,
        agentId: lock.agentId,
        lockedAt: lock.lockedAt.toISOString(),
      }));
    }),
  );

  router.post(
    '/projects/:projectId/locks/unlock',
    resolveOrgFromProject,
    validate(unlockSymbolSchema),
    asyncHandler(async (req, res) => {
      const { file, symbol, agentId } = req.body;
      const projectId = req.params.projectId;

      const existing = await prisma.lock.findUnique({
        where: {
          projectId_file_symbol: { projectId, file, symbol },
        },
      });

      if (!existing) {
        res.status(404).json(fail('NOT_LOCKED', 'Not locked.'));
        return;
      }

      if (existing.agentId !== agentId) {
        res.status(403).json(fail('LOCK_OWNER', `Cannot unlock. Locked by ${existing.agentId}.`));
        return;
      }

      await prisma.lock.delete({ where: { id: existing.id } });

      const event: RealtimeEvent = {
        type: 'lock:released',
        payload: { file: existing.file, symbol: existing.symbol, agentId: existing.agentId, projectId },
        organizationId: req.orgId!,
        projectId,
      };
      io.to(`org:${req.orgId}`).to(`project:${projectId}`).emit('event', event);

      res.json(ok({ success: true }));
    }),
  );

  return router;
}
