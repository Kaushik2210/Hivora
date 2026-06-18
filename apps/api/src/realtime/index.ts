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

    socket.on('subscribe:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('unsubscribe:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('disconnect', () => {
      // rooms auto-cleaned
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
