import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getUserNotifications, subscribeToNotifications } from '../services/notification.service';
import { AuthContext } from './AuthContext';
import { message } from 'antd';

const NotificationContext = createContext<any>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
  
  // Добавляем состояние для отслеживания прочитанных уведомлений в сессии
  const [readNotifications, setReadNotifications] = useState<Set<number>>(new Set());

  // Функция для обновления уведомлений
  const updateNotifications = useCallback((newNotification: any) => {
    console.log('Updating notifications with:', newNotification);
    
    setNotifications(prev => {
      // Проверяем, есть ли уже такое уведомление
      const existingIndex = prev.findIndex(n => n.id === newNotification.id);
      
      if (existingIndex >= 0) {
        // Обновляем существующее уведомление
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...newNotification };
        return updated;
      } else {
        // Добавляем новое уведомление в начало списка
        const newList = [newNotification, ...prev];
        console.log('Added new notification, total count:', newList.length);
        return newList;
      }
    });

    // Немедленно показываем toast для новых уведомлений
    if (newNotification.isNew) {
      message.info({
        content: (
          <div>
            <strong>{newNotification.title}</strong>
            <br />
            {newNotification.description}
          </div>
        ),
        duration: 4,
        style: { marginTop: '20vh' }
      });
    }
  }, []);

  // Функция для загрузки уведомлений
  const loadNotifications = useCallback(async (userId: number) => {
    try {
      const userNotifications = await getUserNotifications(userId);
      setNotifications(userNotifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  }, []);

  // Обновляем счетчик непрочитанных уведомлений
  useEffect(() => {
    const count = notifications.filter(n => n.isNew && !readNotifications.has(n.id)).length;
    setUnreadCount(count);
    console.log('Unread count updated:', count);
  }, [notifications, readNotifications]);

  // Функция для отметки уведомления как прочитанного
  const markAsRead = useCallback((notificationId: number) => {
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      newSet.add(notificationId);
      return newSet;
    });
  }, []);

  // Функция для отметки всех уведомлений как прочитанных
  const markAllAsRead = useCallback(() => {
    const allIds = notifications.map(n => n.id);
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      allIds.forEach(id => newSet.add(id));
      return newSet;
    });
  }, [notifications]);

  useEffect(() => {
    if (!authContext?.user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setPreviousUnreadCount(0);
      setReadNotifications(new Set());
      return;
    }

    // Загружаем уведомления при инициализации
    loadNotifications(authContext.user.id);

    // Подписываемся на новые уведомления
    const unsubscribe = subscribeToNotifications(authContext.user.id, (newNotification) => {
      console.log('Received new notification:', newNotification);
      
      // Немедленно обновляем UI
      updateNotifications(newNotification);
      
      // Дополнительная проверка через небольшую задержку
      setTimeout(() => {
        setNotifications(prev => {
          const hasNotification = prev.some(n => n.id === newNotification.id);
          if (!hasNotification) {
            console.log('Forcing notification update...');
            return [newNotification, ...prev];
          }
          return prev;
        });
      }, 100);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [authContext?.user?.id, loadNotifications, updateNotifications]);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      setNotifications, 
      unreadCount,
      updateNotifications,
      loadNotifications,
      markAsRead,
      markAllAsRead,
      refreshNotifications: () => authContext?.user?.id && loadNotifications(authContext.user.id),
      // Тестовая функция для проверки работы уведомлений
      testNotification: () => {
        const testNotif = {
          id: Date.now(),
          title: 'Тестовое уведомление',
          description: 'Это тестовое уведомление для проверки работы в реальном времени',
          isNew: true,
          type: 'test',
          category: 'test',
          createdAt: new Date().toISOString()
        };
        updateNotifications(testNotif);
      }
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 