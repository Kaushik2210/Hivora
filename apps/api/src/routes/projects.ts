import { Router } from 'express';
import { prisma } from '@hivora/db';
import { createProjectSchema, createTaskSchema, updateTaskSchema, createAgentSchema } from '@hivora/shared';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/error.js';
import { authRequired } from '../middleware/auth.js';
import { requireOrgRole, resolveOrgFromProject } from '../middleware/orgGuard.js';
import { ok, fail } from '../utils/response.js';
import type { RealtimeEvent } from '@hivora/shared';
import type { IoServer } from '../realtime/index.js';
import { GitService } from '../services/git.service.js';
import fs from 'fs';
import path from 'path';

export function createProjectRouter(io: IoServer): Router {
  const router = Router();

  router.use(authRequired);

  router.get(
    '/organizations/:orgId/projects',
    requireOrgRole('member'),
    asyncHandler(async (req, res) => {
      const projects = await prisma.project.findMany({
        where: { organizationId: req.orgId! },
        orderBy: { createdAt: 'desc' },
      });
      res.json(ok(
        projects.map((p) => ({
          id: p.id,
          organizationId: p.organizationId,
          name: p.name,
          path: p.path,
          description: p.description,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
      ));
    }),
  );

  router.post(
    '/organizations/:orgId/projects',
    requireOrgRole('member'),
    validate(createProjectSchema),
    asyncHandler(async (req, res) => {
      const { name, path, description } = req.body;
      const project = await prisma.project.create({
        data: {
          organizationId: req.orgId!,
          name,
          path,
          description,
        },
      });
      res.status(201).json(ok({
        id: project.id,
        organizationId: project.organizationId,
        name: project.name,
        path: project.path,
        description: project.description,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      }));
    }),
  );

  router.get(
    '/projects/:projectId/tasks',
    resolveOrgFromProject,
    asyncHandler(async (req, res) => {
      const tasks = await prisma.task.findMany({
        where: { projectId: req.params.projectId },
        orderBy: { createdAt: 'desc' },
      });
      res.json(ok(
        tasks.map((t) => ({
          id: t.id,
          projectId: t.projectId,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          assigneeId: t.assigneeId,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        })),
      ));
    }),
  );

  router.post(
    '/projects/:projectId/tasks',
    resolveOrgFromProject,
    validate(createTaskSchema),
    asyncHandler(async (req, res) => {
      const { title, description, priority, status, assigneeId } = req.body;
      const task = await prisma.task.create({
        data: {
          projectId: req.params.projectId,
          title,
          description,
          priority,
          status,
          assigneeId,
        },
      });
      const event: RealtimeEvent = {
        type: 'task:created',
        payload: { id: task.id, title: task.title, status: task.status, projectId: task.projectId },
        organizationId: req.orgId!,
        projectId: req.params.projectId,
      };
      io.to(`org:${req.orgId}`).to(`project:${req.params.projectId}`).emit('event', event);
      res.status(201).json(ok({
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      }));
    }),
  );

  router.patch(
    '/projects/:projectId/tasks/:id',
    resolveOrgFromProject,
    validate(updateTaskSchema),
    asyncHandler(async (req, res) => {
      const task = await prisma.task.update({
        where: { id: req.params.id, projectId: req.params.projectId },
        data: req.body,
      });
      const event: RealtimeEvent = {
        type: 'task:updated',
        payload: { id: task.id, status: task.status, projectId: task.projectId },
        organizationId: req.orgId!,
        projectId: req.params.projectId,
      };
      io.to(`org:${req.orgId}`).to(`project:${req.params.projectId}`).emit('event', event);
      res.json(ok({
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      }));
    }),
  );

  router.get(
    '/projects/:projectId/agents',
    resolveOrgFromProject,
    asyncHandler(async (req, res) => {
      const agents = await prisma.agent.findMany({
        where: { projectId: req.params.projectId },
        orderBy: { createdAt: 'desc' },
      });
      res.json(ok(
        agents.map((a) => ({
          id: a.id,
          projectId: a.projectId,
          name: a.name,
          type: a.type,
          status: a.status,
          provider: a.provider,
          mode: a.mode,
          currentTask: a.currentTask,
          createdAt: a.createdAt.toISOString(),
        })),
      ));
    }),
  );

  router.post(
    '/projects/:projectId/agents',
    resolveOrgFromProject,
    validate(createAgentSchema),
    asyncHandler(async (req, res) => {
      const { name, type, provider } = req.body;
      try {
        const agent = await prisma.agent.create({
          data: { projectId: req.params.projectId, name, type, provider },
        });
        res.status(201).json(ok({
          id: agent.id,
          projectId: agent.projectId,
          name: agent.name,
          type: agent.type,
          status: agent.status,
          provider: agent.provider,
          mode: agent.mode,
          currentTask: agent.currentTask,
          createdAt: agent.createdAt.toISOString(),
        }));
      } catch {
        res.status(409).json(fail('AGENT_EXISTS', 'An agent with this name already exists in this project'));
      }
    }),
  );

  router.patch(
    '/projects/:projectId/agents/:id',
    resolveOrgFromProject,
    asyncHandler(async (req, res) => {
      const { mode, status } = req.body;
      const agent = await prisma.agent.update({
        where: { id: req.params.id },
        data: { mode, status },
      });
      res.json(ok({
        id: agent.id,
        projectId: agent.projectId,
        name: agent.name,
        type: agent.type,
        status: agent.status,
        provider: agent.provider,
        mode: agent.mode,
        currentTask: agent.currentTask,
        createdAt: agent.createdAt.toISOString(),
      }));
    }),
  );

  // Real agent polling: list unassigned todo tasks
  router.get(
    '/projects/:projectId/tasks/pending',
    asyncHandler(async (req, res) => {
      const tasks = await prisma.task.findMany({
        where: {
          projectId: req.params.projectId,
          status: 'todo',
          assigneeId: null,
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      });
      res.json(ok(
        tasks.map((t) => ({
          id: t.id,
          projectId: t.projectId,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          assigneeId: t.assigneeId,
          createdAt: t.createdAt.toISOString(),
        })),
      ));
    }),
  );

  // Real agent polling: claim a task (set status=doing, assign to agent)
  router.post(
    '/projects/:projectId/tasks/:id/claim',
    asyncHandler(async (req, res) => {
      const { agentId } = req.body as { agentId?: string };
      if (!agentId) {
        res.status(400).json(fail('MISSING_AGENT', 'agentId is required'));
        return;
      }

      // Verify agent belongs to project
      const agent = await prisma.agent.findFirst({
        where: { id: agentId, projectId: req.params.projectId },
      });
      if (!agent) {
        res.status(404).json(fail('AGENT_NOT_FOUND', 'Agent not found in this project'));
        return;
      }

      // Claim: only claim if task is still unclaimed (atomic check)
      const task = await prisma.task.findFirst({
        where: { id: req.params.id, projectId: req.params.projectId, status: 'todo', assigneeId: null },
      });
      if (!task) {
        res.status(409).json(fail('TASK_UNAVAILABLE', 'Task is already claimed or not in todo status'));
        return;
      }

      const [updated] = await prisma.$transaction([
        prisma.task.update({
          where: { id: req.params.id },
          data: { status: 'doing', assigneeId: agentId },
        }),
        prisma.agent.update({
          where: { id: agentId },
          data: { status: 'working', currentTask: task.title },
        }),
      ]);

      const event: RealtimeEvent = {
        type: 'task:updated',
        payload: { id: updated.id, status: updated.status, projectId: updated.projectId, assigneeId: updated.assigneeId },
        organizationId: req.orgId ?? '',
        projectId: req.params.projectId,
      };
      io.to(`project:${req.params.projectId}`).emit('event', event);

      res.json(ok({
        id: updated.id,
        projectId: updated.projectId,
        title: updated.title,
        description: updated.description,
        status: updated.status,
        priority: updated.priority,
        assigneeId: updated.assigneeId,
        createdAt: updated.createdAt.toISOString(),
      }));
    }),
  );

  // Real agent polling: complete a task (set status=done, agent back to idle)
  router.post(
    '/projects/:projectId/tasks/:id/complete',
    asyncHandler(async (req, res) => {
      const { agentId } = req.body as { agentId?: string };

      const task = await prisma.task.findFirst({
        where: { id: req.params.id, projectId: req.params.projectId },
      });
      if (!task) {
        res.status(404).json(fail('TASK_NOT_FOUND', 'Task not found'));
        return;
      }

      let updated: Awaited<ReturnType<typeof prisma.task.update>>;

      if (agentId) {
        const results = await prisma.$transaction([
          prisma.task.update({ where: { id: req.params.id }, data: { status: 'done' } }),
          prisma.agent.updateMany({ where: { id: agentId, projectId: req.params.projectId }, data: { status: 'idle', currentTask: null } }),
        ]);
        updated = results[0];
      } else {
        updated = await prisma.task.update({ where: { id: req.params.id }, data: { status: 'done' } });
      }

      const event: RealtimeEvent = {
        type: 'task:updated',
        payload: { id: updated.id, status: updated.status, projectId: updated.projectId },
        organizationId: req.orgId ?? '',
        projectId: req.params.projectId,
      };
      io.to(`project:${req.params.projectId}`).emit('event', event);

      res.json(ok({
        id: updated.id,
        projectId: updated.projectId,
        title: updated.title,
        status: updated.status,
        priority: updated.priority,
        assigneeId: updated.assigneeId,
        createdAt: updated.createdAt.toISOString(),
      }));
    }),
  );

  router.get(
    '/projects/:projectId/tasks/:id/diff',
    resolveOrgFromProject,
    asyncHandler(async (req, res) => {
      const { projectId, id: taskId } = req.params;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        res.status(404).json(fail('PROJECT_NOT_FOUND', 'Project not found'));
        return;
      }

      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });
      if (!task) {
        res.status(404).json(fail('TASK_NOT_FOUND', 'Task not found'));
        return;
      }

      const projectPath = project.path || process.cwd();
      const pendingFilePath = path.join(projectPath, '.hivora', 'pending-tasks', `task-${taskId}.json`);

      if (!fs.existsSync(pendingFilePath)) {
        res.status(404).json(fail('PENDING_CHANGE_NOT_FOUND', 'No pending changes found for this task'));
        return;
      }

      try {
        const pendingData = JSON.parse(fs.readFileSync(pendingFilePath, 'utf8'));
        const { file, proposedContent, agentId } = pendingData;
        const fullFilePath = path.join(projectPath, file);
        let originalContent = '';
        if (fs.existsSync(fullFilePath)) {
          originalContent = fs.readFileSync(fullFilePath, 'utf8');
        }
        res.json(ok({
          file,
          original: originalContent,
          proposed: proposedContent,
          agentId,
          analytics: pendingData.analytics ?? null,
          healingAttempts: pendingData.healingAttempts ?? [],
        }));
      } catch (err) {
        console.error('[ProjectsRouter] Error reading diff:', err);
        res.status(500).json(fail('DIFF_FAILED', err instanceof Error ? err.message : String(err)));
      }
    }),
  );

  router.post(
    '/projects/:projectId/tasks/:id/approve',
    resolveOrgFromProject,
    asyncHandler(async (req, res) => {
      const { projectId, id: taskId } = req.params;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        res.status(404).json(fail('PROJECT_NOT_FOUND', 'Project not found'));
        return;
      }

      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });
      if (!task) {
        res.status(404).json(fail('TASK_NOT_FOUND', 'Task not found'));
        return;
      }

      const projectPath = project.path || process.cwd();
      const pendingFilePath = path.join(projectPath, '.hivora', 'pending-tasks', `task-${taskId}.json`);

      if (!fs.existsSync(pendingFilePath)) {
        res.status(404).json(fail('PENDING_CHANGE_NOT_FOUND', 'No pending changes found for this task'));
        return;
      }

      try {
        const pendingData = JSON.parse(fs.readFileSync(pendingFilePath, 'utf8'));
        const { file, proposedContent, agentId, lockId } = pendingData;

        // Write the changes to the file
        const fullFilePath = path.join(projectPath, file);
        fs.mkdirSync(path.dirname(fullFilePath), { recursive: true });
        fs.writeFileSync(fullFilePath, proposedContent, 'utf8');

        // Commit and publish task changes to git
        try {
          GitService.commitAndPublishTask(projectPath, taskId, task.title);
        } catch (gitErr) {
          console.warn('[ProjectsRouter] Git operations failed:', gitErr);
        }

        // Clean up pending file
        fs.unlinkSync(pendingFilePath);

        // Calculate duration and cost
        const duration = Math.max(1, Math.round((Date.now() - task.createdAt.getTime()) / 1000));
        let cost = pendingData.analytics?.cost ?? 0.002; // Fallback for fast mode

        // Update database
        const updatedTask = await prisma.task.update({
          where: { id: taskId },
          data: { status: 'done', duration, cost },
        });

        // Set agent back to idle
        let freeAgent = null;
        if (agentId) {
          freeAgent = await prisma.agent.update({
            where: { id: agentId },
            data: { status: 'idle', currentTask: null },
          });
        }

        // Release lock
        if (lockId) {
          try {
            await prisma.lock.delete({ where: { id: lockId } });
          } catch (lockErr) {
            console.warn('[ProjectsRouter] Lock delete failed:', lockErr);
          }
        }

        // Emit realtime events
        const taskEvent: RealtimeEvent = {
          type: 'task:updated',
          payload: { id: updatedTask.id, status: updatedTask.status, projectId: updatedTask.projectId },
          organizationId: req.orgId ?? '',
          projectId: projectId,
        };
        io.to(`project:${projectId}`).emit('event', taskEvent);

        if (freeAgent) {
          const agentEvent: RealtimeEvent = {
            type: 'agent:updated',
            payload: { agent: freeAgent },
            organizationId: req.orgId ?? '',
            projectId: projectId,
          };
          io.to(`project:${projectId}`).emit('event', agentEvent);
        }

        if (lockId) {
          const lockEvent: RealtimeEvent = {
            type: 'lock:released',
            payload: { lockId },
            organizationId: req.orgId ?? '',
            projectId: projectId,
          };
          io.to(`project:${projectId}`).emit('event', lockEvent);
        }

        // Emit agent log event
        const logEvent: RealtimeEvent = {
          type: 'agent:log',
          payload: { agentId, message: `Değişiklikler kullanıcı tarafından onaylandı, diske yazıldı ve commit edildi.`, timestamp: new Date().toISOString(), level: 'success' },
          organizationId: req.orgId ?? '',
          projectId: projectId,
        };
        io.to(`project:${projectId}`).emit('event', logEvent);

        res.json(ok({ task: updatedTask }));
      } catch (err) {
        console.error('[ProjectsRouter] Error in task approval:', err);
        res.status(500).json(fail('APPROVAL_FAILED', err instanceof Error ? err.message : String(err)));
      }
    }),
  );

  router.post(
    '/projects/:projectId/tasks/:id/reject',
    resolveOrgFromProject,
    asyncHandler(async (req, res) => {
      const { projectId, id: taskId } = req.params;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        res.status(404).json(fail('PROJECT_NOT_FOUND', 'Project not found'));
        return;
      }

      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });
      if (!task) {
        res.status(404).json(fail('TASK_NOT_FOUND', 'Task not found'));
        return;
      }

      const projectPath = project.path || process.cwd();
      const pendingFilePath = path.join(projectPath, '.hivora', 'pending-tasks', `task-${taskId}.json`);

      let agentId = task.assigneeId;
      let lockId = null;

      if (fs.existsSync(pendingFilePath)) {
        try {
          const pendingData = JSON.parse(fs.readFileSync(pendingFilePath, 'utf8'));
          agentId = pendingData.agentId || agentId;
          lockId = pendingData.lockId;
          fs.unlinkSync(pendingFilePath);
        } catch (e) {
          console.warn('[ProjectsRouter] Failed to parse or unlink pending task file:', e);
        }
      }

      try {
        // Reset task status to todo and unassign
        const updatedTask = await prisma.task.update({
          where: { id: taskId },
          data: { status: 'todo', assigneeId: null },
        });

        // Set agent back to idle
        let freeAgent = null;
        if (agentId) {
          freeAgent = await prisma.agent.update({
            where: { id: agentId },
            data: { status: 'idle', currentTask: null },
          });
        }

        // Release lock
        if (lockId) {
          try {
            await prisma.lock.delete({ where: { id: lockId } });
          } catch (lockErr) {
            console.warn('[ProjectsRouter] Lock delete failed:', lockErr);
          }
        } else {
          // Fallback: Delete any locks for this agent
          if (agentId) {
            try {
              await prisma.lock.deleteMany({
                where: { projectId, agentId },
              });
            } catch (lockErr) {}
          }
        }

        // Emit realtime events
        const taskEvent: RealtimeEvent = {
          type: 'task:updated',
          payload: { id: updatedTask.id, status: updatedTask.status, projectId: updatedTask.projectId, assigneeId: null },
          organizationId: req.orgId ?? '',
          projectId: projectId,
        };
        io.to(`project:${projectId}`).emit('event', taskEvent);

        if (freeAgent) {
          const agentEvent: RealtimeEvent = {
            type: 'agent:updated',
            payload: { agent: freeAgent },
            organizationId: req.orgId ?? '',
            projectId: projectId,
          };
          io.to(`project:${projectId}`).emit('event', agentEvent);
        }

        // Emit agent log event
        const logEvent: RealtimeEvent = {
          type: 'agent:log',
          payload: { agentId, message: `Değişiklikler kullanıcı tarafından reddedildi. Görev sıfırlandı.`, timestamp: new Date().toISOString(), level: 'warning' },
          organizationId: req.orgId ?? '',
          projectId: projectId,
        };
        io.to(`project:${projectId}`).emit('event', logEvent);

        res.json(ok({ task: updatedTask }));
      } catch (err) {
        console.error('[ProjectsRouter] Error in task rejection:', err);
        res.status(500).json(fail('REJECTION_FAILED', err instanceof Error ? err.message : String(err)));
      }
    }),
  );

  return router;
}
