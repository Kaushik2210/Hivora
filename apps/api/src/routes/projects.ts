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
          currentTask: agent.currentTask,
          createdAt: agent.createdAt.toISOString(),
        }));
      } catch {
        res.status(409).json(fail('AGENT_EXISTS', 'An agent with this name already exists in this project'));
      }
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

  return router;
}
