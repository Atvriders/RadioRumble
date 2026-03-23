import { useEffect, useRef } from 'react';
import { useWebSocketStore } from '../stores/useWebSocketStore';

const RECONNECT_DELAY = 3000;

export function useWebSocket(contestId: number | null) {
  const { connect, disconnect, connected } = useWebSocketStore();
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (contestId === null) return;

    connect(contestId);

    const unsubscribe = useWebSocketStore.subscribe((state, prev) => {
      if (prev.connected && !state.connected) {
        reconnectTimer.current = setTimeout(() => {
          connect(contestId);
        }, RECONNECT_DELAY);
      }
    });

    return () => {
      unsubscribe();
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      disconnect();
    };
  }, [contestId, connect, disconnect]);

  return { connected };
}
