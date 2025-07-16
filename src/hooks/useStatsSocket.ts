import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_IO_URL = 'http://localhost:3001';

export function useStatsSocket() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    console.log('[SOCKET] connecting to', SOCKET_IO_URL);
    const socket = io(SOCKET_IO_URL, { transports: ['websocket'] });
    socket.on('connect', () => {
      console.log('[SOCKET] connected:', socket.id);
    });
    socket.on('connect_error', (err) => {
      console.error('[SOCKET] connect_error:', err);
    });
    socket.on('disconnect', (reason) => {
      console.warn('[SOCKET] disconnected:', reason);
    });
    socket.on('statsUpdate', (data) => {
      console.log('[SOCKET] statsUpdate:', data);
      setStats(data);
    });
    return (): void => {
      socket.disconnect();
    };
  }, []);

  return stats;
} 