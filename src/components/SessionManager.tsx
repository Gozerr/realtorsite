import React, { useState, useEffect } from 'react';
import { Card, List, Button, Modal, message, Typography, Tag, Space, Tooltip, Alert } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined, DesktopOutlined, MobileOutlined, TabletOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const { Title, Text } = Typography;
const { confirm } = Modal;

interface Session {
  id: number;
  deviceId: string;
  userAgent: string;
  ipAddress: string;
  location: string;
  lastActivityAt: string;
  status: 'active' | 'suspicious' | 'banned' | 'expired';
  isCurrentSession: boolean;
  deviceType?: string;
  browser?: string;
  browserVersion?: string;
}

const SessionManager: React.FC = () => {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/api/user-sessions/my-sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(response.data);
    } catch (error) {
      message.error('Не удалось загрузить сессии');
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId: number) => {
    confirm({
      title: 'Завершить сессию?',
      content: 'Вы уверены, что хотите завершить эту сессию?',
      okText: 'Да',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await api.delete(`/api/user-sessions/my-sessions/${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          message.success('Сессия завершена');
          fetchSessions();
        } catch (error) {
          message.error('Не удалось завершить сессию');
        }
      },
    });
  };

  const terminateAllSessions = async () => {
    confirm({
      title: 'Завершить все сессии?',
      content: 'Это завершит все активные сессии на всех устройствах. Вы уверены?',
      okText: 'Да',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await api.delete('/api/user-sessions/my-sessions', {
            headers: { Authorization: `Bearer ${token}` },
          });
          message.success('Все сессии завершены');
          fetchSessions();
        } catch (error) {
          message.error('Не удалось завершить сессии');
        }
      },
    });
  };

  const getDeviceIcon = (session: Session) => {
    const deviceType = session.deviceType || 'desktop';
    switch (deviceType) {
      case 'mobile':
        return <MobileOutlined />;
      case 'tablet':
        return <TabletOutlined />;
      default:
        return <DesktopOutlined />;
    }
  };

  const getDeviceTypeText = (session: Session) => {
    const deviceType = session.deviceType || 'desktop';
    switch (deviceType) {
      case 'mobile':
        return 'Мобильное устройство';
      case 'tablet':
        return 'Планшет';
      default:
        return 'Компьютер';
    }
  };

  const getBrowserInfo = (session: Session) => {
    if (session.browser && session.browserVersion) {
      return `${session.browser} ${session.browserVersion}`;
    }
    return 'Неизвестный браузер';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'suspicious':
        return 'orange';
      case 'banned':
        return 'red';
      case 'expired':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активна';
      case 'suspicious':
        return 'Подозрительная';
      case 'banned':
        return 'Заблокирована';
      case 'expired':
        return 'Истекла';
      default:
        return 'Неизвестно';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  return (
    <Card title="Управление сессиями" loading={loading}>
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Предупреждение о безопасности */}
        <Alert
          message="Security Warning"
          description="Sharing your login credentials with others may result in account suspension. Each user should have their own account."
          type="warning"
          showIcon
          icon={<SafetyCertificateOutlined />}
          style={{ marginBottom: 16 }}
        />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>Активные сессии: {sessions.filter(s => s.status === 'active').length}</Text>
          <Button 
            danger 
            onClick={terminateAllSessions}
            disabled={sessions.filter(s => s.status === 'active').length <= 1}
          >
            Завершить все сессии
          </Button>
        </div>

        <List
          dataSource={sessions}
          renderItem={(session) => (
            <List.Item
              actions={[
                session.status === 'active' && !session.isCurrentSession && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => terminateSession(session.id)}
                  >
                    Завершить
                  </Button>
                ),
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={getDeviceIcon(session)}
                title={
                  <Space>
                    <span>
                      {session.isCurrentSession ? 'Текущая сессия' : getDeviceTypeText(session)}
                    </span>
                    {session.isCurrentSession && (
                      <Tag color="blue">Текущая</Tag>
                    )}
                    <Tag color={getStatusColor(session.status)}>
                      {getStatusText(session.status)}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <div>
                      <Text type="secondary">Браузер: {getBrowserInfo(session)}</Text>
                    </div>
                    <div>
                      <Text type="secondary">IP: {session.ipAddress}</Text>
                    </div>
                    <div>
                      <Text type="secondary">Местоположение: {session.location}</Text>
                    </div>
                    <div>
                      <Text type="secondary">
                        Последняя активность: {formatDate(session.lastActivityAt)}
                      </Text>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Space>
    </Card>
  );
};

export default SessionManager; 