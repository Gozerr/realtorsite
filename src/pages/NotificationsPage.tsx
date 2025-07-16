import React, { useEffect, useState } from 'react';
import { List, Badge, Button, Tabs, Spin, Empty } from 'antd';
import { getUserNotifications, markNotificationAsRead, subscribeToNotifications } from '../services/notification.service';
import { AuthContext } from '../context/AuthContext';
import { UserOutlined, HomeOutlined, MessageOutlined, InfoCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationsPage() {
  const { notifications, setNotifications, refreshNotifications, testNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('all');
  const authContext = React.useContext(AuthContext);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshNotifications();
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = () => {
    testNotification();
  };

  const filtered = notifications.filter((n: any) => {
    if (tab === 'all') return true;
    if (tab === 'new') return n.isNew;
    if (tab === 'read') return !n.isNew;
    return true;
  });

  const handleMarkAsRead = async (id: number) => {
    await markNotificationAsRead(id);
    setNotifications((notifications: any[]) => notifications.map((n: any) => n.id === id ? { ...n, isNew: false } : n));
  };

  const handleMarkAllAsRead = async () => {
    for (const n of (notifications as any[]).filter((n: any) => n.isNew)) {
      await markNotificationAsRead(n.id);
    }
    setNotifications((notifications: any[]) => (notifications as any[]).map((n: any) => ({ ...n, isNew: false })));
  };

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

  // Русские статусы
  function getStatusLabel(status: string) {
    switch (status) {
      case 'for_sale': return 'В продаже';
      case 'in_deal': return 'В сделке';
      case 'reserved': return 'На брони';
      case 'sold': return 'Продан';
      default: return status;
    }
  }

  return (
    <div style={{ width: '100vw', margin: 0, padding: '32px 0', minHeight: '100vh', background: 'linear-gradient(120deg, #f8fafc 0%, #e9f0fb 100%)' }}>
      <div style={{ width: '100%', margin: '0 auto', padding: '0 0' }}>
        <h2 style={{ fontWeight: 800, fontSize: 24, letterSpacing: -1, marginBottom: 24, color: '#2d3652' }}>
          <span style={{ verticalAlign: 'middle', marginRight: 12, color: '#6c63ff' }}><InfoCircleOutlined /></span>
          Уведомления
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
          <Tabs activeKey={tab} onChange={setTab} style={{ marginBottom: 0, fontWeight: 600, flex: 1 }} size="large">
            <Tabs.TabPane tab={<span>Все</span>} key="all" />
            <Tabs.TabPane tab={<span>Новые <Badge count={(notifications as any[]).filter((n: any) => n.isNew).length} /></span>} key="new" />
            <Tabs.TabPane tab={<span>Прочитанные</span>} key="read" />
          </Tabs>
          <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
            <Button 
              type="primary" 
              ghost 
              size="small" 
              onClick={handleRefresh}
              loading={loading}
            >
              Обновить
            </Button>
            <Button 
              type="default" 
              size="small" 
              onClick={handleTestNotification}
            >
              Тест
            </Button>
            {(notifications as any[]).some((n: any) => n.isNew) && (
              <Button type="primary" ghost size="small" onClick={handleMarkAllAsRead}>
                Прочитать все
              </Button>
            )}
          </div>
        </div>
        {loading ? <Spin size="large" style={{ display: 'block', margin: '60px auto' }} /> : (
          <List
            dataSource={filtered}
            locale={{ emptyText: <Empty description="Нет уведомлений" /> }}
            renderItem={(item: any) => (
              <List.Item
                key={item.id}
                style={{
                  background: item.isNew ? 'linear-gradient(90deg, #e3f0ff 0%, #f7faff 100%)' : '#fff',
                  borderRadius: 14,
                  marginBottom: 12,
                  boxShadow: '0 2px 12px rgba(40,60,90,0.06)',
                  border: '1px solid #e6eaf1',
                  padding: 18,
                  transition: 'box-shadow 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                  width: '100%',
                  fontSize: 15,
                }}
                actions={item.isNew ? [<Button size="small" type="primary" ghost onClick={() => handleMarkAsRead(item.id)}>Отметить как прочитано</Button>] : []}
              >
                <List.Item.Meta
                  avatar={<div style={{ fontSize: 24, marginRight: 8 }}>{getIcon(item.type)}</div>}
                  title={<span style={{ fontWeight: 600, fontSize: 16, color: '#2d3652' }}>{item.title} {item.isNew && <Badge color="#6c63ff" text="Новое" />}</span>}
                  description={<>
                    <div style={{ fontSize: 14, color: '#4a5677', marginBottom: 4 }}>
                      {item.description.replace(/статус: (for_sale|in_deal|reserved|sold)/, (m: string, s: string) => `статус: ${getStatusLabel(s)}`)}
                    </div>
                    <div style={{ fontSize: 12, color: '#8fa1c7', fontStyle: 'italic' }}>{formatTime(item.createdAt)}</div>
                  </>}
                />
              </List.Item>
            )}
          />
        )}
      </div>
      <style>{`
        .ant-tabs-nav {
          font-size: 16px !important;
        }
        .ant-list-item {
          animation: fadeInUp 0.6s;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate3d(0, 40px, 0); }
          to { opacity: 1; transform: none; }
        }
        @media (max-width: 767px) {
          .notification-list-col {
            flex: 0 0 100% !important;
            max-width: 100% !important;
          }
          .ant-btn, .ant-input {
            font-size: 18px !important;
            height: 48px !important;
          }
        }
      `}</style>
    </div>
  );
} 