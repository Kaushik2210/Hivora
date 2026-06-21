import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { RealtimeEvent } from '@hivora/shared';

// Configurable so two developers can connect to a shared remote server,
// not just localhost. Set via Settings → Server URL (hivora_server_url).
function resolveWsUrl(): string {
  return localStorage.getItem('hivora_server_url') || 'http://localhost:4000';
}

export function useRealtime(projectId: string | undefined, onEvent: (event: RealtimeEvent) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('hivora_access_token') || '';

    if (!socketRef.current) {
      socketRef.current = io(resolveWsUrl(), {
        auth: { token: token || 'dev-token' },
        query: projectId ? { projectId } : undefined,
      });

      socketRef.current.on('event', (event: RealtimeEvent) => {
        console.log('[Realtime] Received event:', event);
        onEvent(event);
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('[Realtime] Connection error:', err);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [projectId, onEvent]);
}
