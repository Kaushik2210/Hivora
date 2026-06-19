import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { RealtimeEvent } from '@hivora/shared';

const WS_URL = 'http://localhost:4000';

export function useRealtime(projectId: string | undefined, onEvent: (event: RealtimeEvent) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token') || '';
    
    if (!socketRef.current) {
      socketRef.current = io(WS_URL, {
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
