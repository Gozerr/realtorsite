import React, { useState, useEffect } from 'react';
import { Badge, Tabs, List, Popover, Spin } from 'antd';
import { BellOutlined, UserOutlined, HomeOutlined, MessageOutlined, InfoCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getUserNotifications, markNotificationAsRead, subscribeToNotifications } from '../services/notification.service';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationDropdown() {
  const { notifications, setNotifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const authContext = React.useContext(AuthContext);

  const mainNotifications = notifications.filter((n: any) => n.type !== 'system');
  const systemNotifications = notifications.filter((n: any) => n.type === 'system');
  
  // Принудительное обновление при изменении unreadCount
  useEffect(() => {
    console.log('NotificationDropdown: unreadCount changed to', unreadCount);
  }, [unreadCount]);

  const handleNotificationClick = async (id: number) => {
    setOpen(false);
    // Отмечаем как прочитанное в контексте
    markAsRead(id);
    // Также отправляем запрос на сервер
    await markNotificationAsRead(id);
    setNotifications((notifications: any[]) => notifications.map((n: any) => n.id === id ? { ...n, isNew: false } : n));
    navigate(`/notifications#notification-${id}`);
  };

  const handleMarkAllAsRead = async () => {
    // Отмечаем все как прочитанные в контексте
    markAllAsRead();
    // Отправляем запросы на сервер
    for (const n of (notifications as any[]).filter((n: any) => n.isNew)) {
      await markNotificationAsRead(n.id);
    }
    setNotifications((notifications: any[]) => (notifications as any[]).map((n: any) => ({ ...n, isNew: false })));
  };

  const content = (
    <Tabs defaultActiveKey="main" style={{ width: 320 }}>
      <Tabs.TabPane tab="Основные" key="main">
        {loading ? <Spin /> : (
          <List
            dataSource={mainNotifications.slice(0, 3)}
            renderItem={(item: any) => (
              <List.Item onClick={() => handleNotificationClick(item.id)} style={{ cursor: 'pointer' }}>
                <List.Item.Meta
                  avatar={getIcon(item.type)}
                  title={<span>{item.title} {item.isNew && <Badge color="blue" text="Новое" />}</span>}
                  description={<>
                    <div>{item.description}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{formatTime(item.createdAt)}</div>
                  </>}
                />
              </List.Item>
            )}
          />
        )}
        {mainNotifications.some((n: any) => n.isNew) && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <a onClick={handleMarkAllAsRead} style={{ color: '#6c63ff', cursor: 'pointer', fontWeight: 500 }}>Прочитать все</a>
          </div>
        )}
      </Tabs.TabPane>
      <Tabs.TabPane tab="Системные" key="system">
        <List
          dataSource={systemNotifications.slice(0, 3)}
          renderItem={(item: any) => (
            <List.Item onClick={() => handleNotificationClick(item.id)} style={{ cursor: 'pointer' }}>
              <List.Item.Meta
                avatar={getIcon(item.type)}
                title={<span>{item.title} {item.isNew && <Badge color="blue" text="Новое" />}</span>}
                description={<>
                  <div>{item.description}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{formatTime(item.createdAt)}</div>
                </>}
              />
            </List.Item>
          )}
        />
        {systemNotifications.some((n: any) => n.isNew) && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <a onClick={handleMarkAllAsRead} style={{ color: '#6c63ff', cursor: 'pointer', fontWeight: 500 }}>Прочитать все</a>
          </div>
        )}
      </Tabs.TabPane>
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <a href="/notifications">Все уведомления</a>
      </div>
    </Tabs>
  );

  function getIcon(type: string) {
    switch (type) {
      case 'clients': return <UserOutlined style={{ color: '#e85aad' }} />;
      case 'objects': return <HomeOutlined style={{ color: '#6c63ff' }} />;
      case 'messages': return <MessageOutlined style={{ color: '#4caf50' }} />;
      case 'reminder': return <ClockCircleOutlined style={{ color: '#ff9800' }} />;
      case 'system': return <InfoCircleOutlined style={{ color: '#2196f3' }} />;
      default: return <InfoCircleOutlined />;
    }
  }
  function formatTime(date: string) {
    const d = new Date(date);
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Badge count={unreadCount}>
        <BellOutlined style={{ fontSize: 22, cursor: 'pointer', transition: 'color 0.2s' }} />
      </Badge>
    </Popover>
  );
}