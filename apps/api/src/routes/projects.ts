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

  return router;
}
