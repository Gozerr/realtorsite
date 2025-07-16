import api from './api';
import { io } from 'socket.io-client';

// Always use backend on port 3001 for notifications WebSocket, regardless of frontend port
const BACKEND_HOST = window.location.hostname;
const SOCKET_IO_URL = `http://${BACKEND_HOST}:3001`;

let socket: ReturnType<typeof io> | null = null;
let currentUserId: number | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export function subscribeToNotifications(userId: number, onNotification: (notif: any) => void) {
  if (socket && currentUserId !== userId) {
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
  
  currentUserId = userId;
  
  if (!socket) {
    socket = io(SOCKET_IO_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.log('[Notifications] Socket connected, joining room:', `user_${userId}`);
      reconnectAttempts = 0;
      socket!.emit('joinRoom', `user_${userId}`);
    });

    socket.on('connect_error', (err) => {
      console.error('[Notifications] Socket connect_error:', err);
      reconnectAttempts++;
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('[Notifications] Max reconnection attempts reached');
      }
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Notifications] Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        setTimeout(() => {
          if (socket) {
            socket.connect();
          }
        }, 1000);
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[Notifications] Socket reconnected after', attemptNumber, 'attempts');
      socket!.emit('joinRoom', `user_${userId}`);
    });

    socket.on('reconnect_error', (error) => {
      console.error('[Notifications] Socket reconnect_error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('[Notifications] Socket reconnect_failed');
    });
  }

  const handler = (notif: any) => {
    console.log('[Notifications] Received notification:', notif);
    
    // Проверяем, что уведомление содержит необходимые поля
    if (!notif || !notif.id) {
      console.error('[Notifications] Invalid notification received:', notif);
      return;
    }
    
    // Немедленно вызываем обработчик
    onNotification(notif);
    
    // Дополнительная проверка через небольшую задержку
    setTimeout(() => {
      console.log('[Notifications] Confirming notification delivery:', notif.id);
    }, 50);
  };

  socket.on('newNotification', handler);
  
  return () => {
    if (socket) {
      socket.off('newNotification', handler);
    }
  };
}

export const getAllNotifications = async () => {
  const res = await api.get('/api/notifications');
  return res.data;
};

export const getUserNotifications = async (userId: number) => {
  const res = await api.get(`/api/notifications/user/${userId}`);
  return res.data;
};

export const createNotification = async (data: any) => {
  const res = await api.post('/api/notifications', data);
  return res.data;
};

export const markNotificationAsRead = async (id: number) => {
  await api.patch(`/api/notifications/${id}/read`);
};

export const removeNotification = async (id: number) => {
  await api.delete(`/api/notifications/${id}`);
};

export const getUserNotificationSettings = async (userId: number) => {
  const res = await api.get(`/api/notifications/settings/${userId}`);
  return res.data;
};

export const updateUserNotificationSettings = async (userId: number, data: any) => {
  const res = await api.post(`/api/notifications/settings/${userId}`, data);
  return res.data;
}; 