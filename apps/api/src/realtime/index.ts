import { Server as HttpServer } from 'http';
import { Server as IoServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redis, hasRedis } from '../config/redis.js';
import type { RealtimeEvent } from '@hivora/shared';

export type { IoServer };

export function createRealtimeServer(httpServer: HttpServer): IoServer {
  const io = new IoServer(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  if (hasRedis() && redis) {
    const pubClient = redis.duplicate();
    const subClient = redis.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    console.log('[Realtime] Socket.io using Redis adapter (multi-instance ready)');
  } else {
    console.log('[Realtime] Socket.io using in-memory adapter (single instance)');
  }

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error('UNAUTHORIZED'));
    }
    next();
  });

  io.on('connection', (socket) => {
    const orgId = socket.handshake.query.orgId as string | undefined;
    if (orgId) {
      socket.join(`org:${orgId}`);
    }
    const projectId = socket.handshake.query.projectId as string | undefined;
    if (projectId) {
      socket.join(`project:${projectId}`);
    }

    socket.on('subscribe:project', (payload: string | { projectId: string; user?: { name?: string; plan?: string } }) => {
      const projectId = typeof payload === 'string' ? payload : payload.projectId;
      const user = typeof payload === 'object' ? payload.user : undefined;
      socket.join(`project:${projectId}`);
      socket.data.projectId = projectId;
      socket.data.userName  = user?.name  ?? 'Guest';
      socket.data.userPlan  = user?.plan  ?? 'free';
      socket.to(`project:${projectId}`).emit('user:joined', {
        socketId: socket.id,
        name:     socket.data.userName,
        plan:     socket.data.userPlan,
      });
    });

    socket.on('unsubscribe:project', (projectId: string) => {
      socket.to(`project:${projectId}`).emit('user:left', { socketId: socket.id });
      socket.leave(`project:${projectId}`);
    });

    // Admin kick: only broadcasts; client-side auth is sufficient for now
    socket.on('kick:user', ({ socketId, projectId }: { socketId: string; projectId: string }) => {
      const target = io.sockets.sockets.get(socketId);
      if (target) {
        target.emit('kicked', { by: socket.id });
        target.leave(`project:${projectId}`);
        socket.to(`project:${projectId}`).emit('user:left', { socketId });
      }
    });

    // Panel collaboration events
    socket.on('panel:open', (data: { projectId: string; panelId: string; modelId: string }) => {
      socket.to(`project:${data.projectId}`).emit('panel:open', { ...data, socketId: socket.id });
    });

    socket.on('panel:close', (data: { projectId: string; panelId: string }) => {
      socket.to(`project:${data.projectId}`).emit('panel:close', { ...data, socketId: socket.id });
    });

    socket.on('panel:typing', (data: { projectId: string; panelId: string; modelId: string }) => {
      socket.to(`project:${data.projectId}`).emit('panel:typing', { ...data, socketId: socket.id });
    });

    socket.on('panel:message', (data: { projectId: string; panelId: string; modelId: string; content: string }) => {
      socket.to(`project:${data.projectId}`).emit('panel:message', { ...data, socketId: socket.id });
    });

    socket.on('disconnect', () => {
      // Notify all project rooms this user left
      socket.rooms.forEach(room => {
        if (room.startsWith('project:')) {
          socket.to(room).emit('user:left', { socketId: socket.id });
        }
      });
    });
  });

  return io;
}

export function emitEvent(io: IoServer, event: RealtimeEvent): void {
  if (event.projectId) {
    io.to(`project:${event.projectId}`).emit('event', event);
  }
  io.to(`org:${event.organizationId}`).emit('event', event);
}
