import { prisma } from '@hivora/db';
import { io } from '../index.js';
import { emitEvent } from '../realtime/index.js';

let interval: NodeJS.Timeout | null = null;

export function startAgentSimulation() {
  if (interval) return;
  console.log('[AgentService] Starting Agent Simulation Motor...');

  interval = setInterval(async () => {
    try {
      // 1. Find an idle agent
      const idleAgent = await prisma.agent.findFirst({
        where: { status: 'idle', type: 'ai' },
      });

      if (!idleAgent) return; // No idle agents available

      // 2. Find a todo task in the same project
      const todoTask = await prisma.task.findFirst({
        where: { projectId: idleAgent.projectId, status: 'todo' },
        orderBy: { createdAt: 'asc' }, // Get oldest task
      });

      if (!todoTask) return; // No tasks to do

      // Get project to fetch organizationId
      const project = await prisma.project.findUnique({
        where: { id: idleAgent.projectId },
        select: { organizationId: true },
      });
      if (!project) return;

      const orgId = project.organizationId;

      console.log(`[AgentService] Agent ${idleAgent.name} picking up task ${todoTask.id}`);

      // 3. Update task to 'doing' and agent to 'working'
      const updatedTask = await prisma.task.update({
        where: { id: todoTask.id },
        data: { status: 'doing', assigneeId: idleAgent.id },
      });

      const updatedAgent = await prisma.agent.update({
        where: { id: idleAgent.id },
        data: { status: 'working', currentTask: todoTask.title },
      });

      // Emit events
      emitEvent(io, {
        type: 'task:updated',
        projectId: todoTask.projectId,
        organizationId: orgId,
        payload: { task: updatedTask },
      } as any);

      emitEvent(io, {
        type: 'agent:updated',
        projectId: idleAgent.projectId,
        organizationId: orgId,
        payload: { agent: updatedAgent },
      } as any);

      // 4. Create a mock Lock for AST simulation
      const lock = await prisma.lock.create({
        data: {
          projectId: idleAgent.projectId,
          agentId: idleAgent.id,
          file: 'src/App.tsx',
          symbol: `Component_${Math.floor(Math.random() * 100)}`,
        },
      });

      emitEvent(io, {
        type: 'lock:acquired',
        projectId: idleAgent.projectId,
        organizationId: orgId,
        payload: { lock },
      } as any);

      // 5. Simulate work for 8-15 seconds
      const workDuration = Math.floor(Math.random() * 7000) + 8000;
      setTimeout(async () => {
        console.log(`[AgentService] Agent ${idleAgent.name} finished task ${todoTask.id}`);
        try {
          // Mark task as done
          const finishedTask = await prisma.task.update({
            where: { id: todoTask.id },
            data: { status: 'done' },
          });

          // Mark agent as idle
          const freeAgent = await prisma.agent.update({
            where: { id: idleAgent.id },
            data: { status: 'idle', currentTask: null },
          });

          // Delete lock
          await prisma.lock.delete({ where: { id: lock.id } });

          // Emit events
          emitEvent(io, {
            type: 'task:updated',
            projectId: finishedTask.projectId,
            organizationId: orgId,
            payload: { task: finishedTask },
          } as any);

          emitEvent(io, {
            type: 'agent:updated',
            projectId: freeAgent.projectId,
            organizationId: orgId,
            payload: { agent: freeAgent },
          } as any);

          emitEvent(io, {
            type: 'lock:released',
            projectId: lock.projectId,
            organizationId: orgId,
            payload: { lockId: lock.id },
          } as any);
        } catch (e) {
          console.error('[AgentService] Error finishing task', e);
        }
      }, workDuration);

    } catch (error) {
      console.error('[AgentService] Error in simulation loop', error);
    }
  }, 5000);
}

export function stopAgentSimulation() {
  if (interval) {
    clearInterval(interval);
    interval = null;
    console.log('[AgentService] Stopped Agent Simulation Motor.');
  }
}
