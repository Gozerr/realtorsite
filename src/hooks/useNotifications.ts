import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';

interface NotificationCounters {
  total: number;
  chat: number;
  support: number;
  property: number;
  system: number;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [counters, setCounters] = useState<NotificationCounters>({
    total: 0,
    chat: 0,
    support: 0,
    property: 0,
    system: 0,
  });
  const [loading, setLoading] = useState(false);

  // Временные счетчики для просмотренных уведомлений (не сохраняются в localStorage)
  const [viewedNotifications, setViewedNotifications] = useState<Set<string>>(new Set());

  const fetchCounters = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/api/notifications/counters/${user.id}`);
      setCounters(response.data);
    } catch (error) {
      console.error('Error fetching notification counters:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (category?: string) => {
    if (!user?.id) return;
    
    try {
      const url = category 
        ? `/api/notifications/mark-read/${user.id}/${category}`
        : `/api/notifications/mark-read/${user.id}`;
      await api.patch(url);
      await fetchCounters(); // Обновляем счетчики после отметки как прочитанные
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Функция для обновления счетчиков при изменениях
  const updateCounters = (type: string, action: 'increment' | 'decrement' | 'set', value?: number) => {
    setCounters(prev => {
      const newCounters = { ...prev };
      
      switch (type) {
        case 'chat':
          if (action === 'increment') newCounters.chat++;
          else if (action === 'decrement') {
            if (value !== undefined) {
              newCounters.chat = Math.max(0, newCounters.chat - value);
            } else {
              newCounters.chat = Math.max(0, newCounters.chat - 1);
            }
          }
          else if (action === 'set' && value !== undefined) newCounters.chat = value;
          break;
        case 'support':
          if (action === 'increment') newCounters.support++;
          else if (action === 'decrement') {
            if (value !== undefined) {
              newCounters.support = Math.max(0, newCounters.support - value);
            } else {
              newCounters.support = Math.max(0, newCounters.support - 1);
            }
          }
          else if (action === 'set' && value !== undefined) newCounters.support = value;
          break;
        case 'property':
          if (action === 'increment') newCounters.property++;
          else if (action === 'decrement') {
            if (value !== undefined) {
              newCounters.property = Math.max(0, newCounters.property - value);
            } else {
              newCounters.property = Math.max(0, newCounters.property - 1);
            }
          }
          else if (action === 'set' && value !== undefined) newCounters.property = value;
          break;
        case 'system':
          if (action === 'increment') newCounters.system++;
          else if (action === 'decrement') {
            if (value !== undefined) {
              newCounters.system = Math.max(0, newCounters.system - value);
            } else {
              newCounters.system = Math.max(0, newCounters.system - 1);
            }
          }
          else if (action === 'set' && value !== undefined) newCounters.system = value;
          break;
      }
      
      // Обновляем общий счетчик
      newCounters.total = newCounters.chat + newCounters.support + newCounters.property + newCounters.system;
      
      return newCounters;
    });
  };

  // Функция для отметки уведомлений как просмотренных (только в сессии)
  const markAsViewed = (notificationIds: string[]) => {
    const newViewed = new Set(viewedNotifications);
    notificationIds.forEach(id => newViewed.add(id));
    setViewedNotifications(newViewed);
  };

  // Функция для проверки, просмотрено ли уведомление
  const isViewed = (notificationId: string) => {
    return viewedNotifications.has(notificationId);
  };

  // Функция для очистки просмотренных уведомлений (при смене пользователя или выходе)
  const clearViewedNotifications = () => {
    setViewedNotifications(new Set());
  };

  useEffect(() => {
    fetchCounters();
    
    // Подключаемся к WebSocket для получения уведомлений в реальном времени
    const socket = io('http://localhost:3001', {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Notifications hook connected to WebSocket');
    });

    // Слушаем уведомления о новых сообщениях в чате
    socket.on('notification', (data) => {
      if (data.type === 'chat_message' || data.category === 'chat') {
        console.log('New chat message notification received');
        updateCounters('chat', 'increment');
      }
      
      // Слушаем уведомления о новых запросах поддержки
      if (data.type === 'support_request' || data.category === 'support') {
        console.log('New support request notification received');
        updateCounters('support', 'increment');
      }
      
      // Слушаем уведомления о решении запросов поддержки
      if (data.type === 'support_resolved') {
        console.log('Support request resolved notification received');
        updateCounters('support', 'decrement');
      }
      
      // Слушаем уведомления о закрытии запросов поддержки
      if (data.type === 'support_closed') {
        console.log('Support request closed notification received');
        updateCounters('support', 'decrement');
      }
    });

    // Обновляем счетчики каждые 30 секунд как fallback
    const interval = setInterval(fetchCounters, 30000);
    
    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [user?.id]);

  return {
    counters,
    loading,
    fetchCounters,
    markAsRead,
    updateCounters,
    markAsViewed,
    isViewed,
    clearViewedNotifications,
  };
}; 