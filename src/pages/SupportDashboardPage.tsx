import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Typography, 
  Row, 
  Col, 
  Statistic,
  message,
  Space,
  Tooltip,
  Tabs,
  Badge,
  Descriptions,
  Timeline,
  Divider,
  Avatar,
  List
} from 'antd';
import { 
  PhoneOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  CloseCircleOutlined,
  UserOutlined,
  MessageOutlined,
  ReloadOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  EditOutlined,
  DeleteOutlined,
  HomeOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { 
  getSupportRequests, 
  getPendingSupportRequests, 
  assignSupportRequest, 
  resolveSupportRequest, 
  closeSupportRequest,
  getSupportStats,
  getPendingAgencyAuthorizations,
  getAgencyAuthorizationDetails,
  approveAgencyAuthorization,
  rejectAgencyAuthorization,
  SupportRequest 
} from '../services/support.service';
import { useNotifications } from '../hooks/useNotifications';
import { io } from 'socket.io-client';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface UserInfo {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  phone: string;
  telegramUsername?: string;
  whatsappNumber?: string;
  agency?: string;
  role: string;
  photo?: string;
  createdAt: string;
  lastLoginAt?: string;
  activeSessions?: Array<{
    id: string;
    deviceInfo: string;
    ipAddress: string;
    lastActivity: string;
  }>;
}

interface UserAction {
  id: number;
  action: string;
  details: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
  error?: string;
}

interface RequestHistory {
  id: number;
  action: string;
  details: string;
  timestamp: string;
  userId: number;
  userName: string;
}

const SupportDashboardPage: React.FC = () => {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [archivedRequests, setArchivedRequests] = useState<SupportRequest[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [resolveForm] = Form.useForm();
  const { updateCounters } = useNotifications();
  
  // Состояния для новых модальных окон
  const [userInfoModalVisible, setUserInfoModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [userActionsModalVisible, setUserActionsModalVisible] = useState(false);
  const [selectedUserActions, setSelectedUserActions] = useState<UserAction[]>([]);
  const [requestHistoryModalVisible, setRequestHistoryModalVisible] = useState(false);
  const [selectedRequestHistory, setSelectedRequestHistory] = useState<RequestHistory[]>([]);
  
  // Состояния для авторизации агентства
  const [pendingAuthorizations, setPendingAuthorizations] = useState<any[]>([]);
  const [authorizationDetailsModalVisible, setAuthorizationDetailsModalVisible] = useState(false);
  const [selectedAuthorization, setSelectedAuthorization] = useState<any>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectForm] = Form.useForm();
  
  // Используем состояние для отслеживания просмотренных запросов в сессии (не сохраняется при обновлении)
  const [viewedActiveRequests, setViewedActiveRequests] = useState<Set<number>>(new Set());
  const [viewedArchivedRequests, setViewedArchivedRequests] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData();
    
    // Подключаемся к WebSocket для получения уведомлений о новых запросах
    const socket = io('http://localhost:3001', {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Support dashboard connected to WebSocket');
    });

    // Слушаем уведомления о новых запросах поддержки
    socket.on('notification', (data) => {
      if (data.type === 'support_request' || data.category === 'support') {
        console.log('New support request received, refreshing data...');
        loadData();
        message.info('Поступил новый запрос в службу поддержки');
      }
      
      // Слушаем уведомления о решении и закрытии запросов
      if (data.type === 'support_resolved' || data.type === 'support_closed') {
        console.log('Support request status changed, refreshing data...');
        loadData();
      }
    });

    // Автоматическое обновление данных каждые 30 секунд
    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestsData, statsData, authorizationsData] = await Promise.all([
        getSupportRequests(),
        getSupportStats(),
        getPendingAgencyAuthorizations()
      ]);
      
      // Разделяем запросы на активные и архивные
      const activeRequests = requestsData.filter(req => req.status !== 'closed');
      const closedRequests = requestsData.filter(req => req.status === 'closed');
      
      setRequests(activeRequests);
      setArchivedRequests(closedRequests);
      setStats(statsData);
      setPendingAuthorizations(authorizationsData);
    } catch (error) {
      message.error('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
    message.success('Данные обновлены');
  };

  const handleAssign = async (requestId: number) => {
    try {
      await assignSupportRequest(requestId);
      message.success('Запрос назначен вам');
      loadData();
    } catch (error) {
      message.error('Ошибка при назначении запроса');
    }
  };

  const handleResolve = async (values: { resolution: string }) => {
    if (!selectedRequest) return;
    
    try {
      await resolveSupportRequest(selectedRequest.id, values.resolution);
      message.success('Запрос отмечен как решенный');
      setResolveModalVisible(false);
      resolveForm.resetFields();
      setSelectedRequest(null);
      loadData();
    } catch (error) {
      message.error('Ошибка при решении запроса');
    }
  };

  const handleClose = async (requestId: number) => {
    try {
      await closeSupportRequest(requestId);
      message.success('Запрос закрыт');
      loadData();
    } catch (error) {
      message.error('Ошибка при закрытии запроса');
    }
  };

  const handleTabChange = (activeKey: string) => {
    if (activeKey === 'active') {
      // Отмечаем все активные запросы как просмотренные
      const newViewedActive = new Set(viewedActiveRequests);
      requests.forEach(req => newViewedActive.add(req.id));
      setViewedActiveRequests(newViewedActive);
      
      // Уменьшаем счетчик поддержки на количество непросмотренных активных запросов
      const unviewedActive = requests.filter(req => !viewedActiveRequests.has(req.id)).length;
      if (unviewedActive > 0) {
        updateCounters('support', 'decrement', unviewedActive);
        message.info(`Просмотрено ${unviewedActive} новых активных запросов`);
      }
    } else if (activeKey === 'archived') {
      // Отмечаем все архивные запросы как просмотренные
      const newViewedArchived = new Set(viewedArchivedRequests);
      archivedRequests.forEach(req => newViewedArchived.add(req.id));
      setViewedArchivedRequests(newViewedArchived);
      
      // Уменьшаем счетчик поддержки на количество непросмотренных архивных запросов
      const unviewedArchived = archivedRequests.filter(req => !viewedArchivedRequests.has(req.id)).length;
      if (unviewedArchived > 0) {
        updateCounters('support', 'decrement', unviewedArchived);
        message.info(`Просмотрено ${unviewedArchived} новых запросов в архиве`);
      }
    }
  };

  const handleRequestClick = (record: SupportRequest) => {
    setSelectedRequest(record);
    setResolveModalVisible(true);
  };

  const handleUserInfoClick = async (record: SupportRequest) => {
    try {
      // Здесь нужно будет добавить API для получения информации о пользователе
      const mockUserInfo: UserInfo = {
        id: 1,
        firstName: 'Иван',
        lastName: 'Иванов',
        middleName: 'Иванович',
        email: 'ivan@example.com',
        phone: '+7 (999) 123-45-67',
        telegramUsername: '@ivan_ivanov',
        whatsappNumber: '+7 (999) 123-45-67',
        agency: 'ООО "Риэлт-Сервис"',
        role: 'agent',
        photo: 'https://via.placeholder.com/150',
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: '2024-01-15T10:30:00Z',
        activeSessions: [
          {
            id: 'session1',
            deviceInfo: 'Chrome 120.0.0.0 on Windows 10',
            ipAddress: '192.168.1.100',
            lastActivity: '2024-01-15T10:30:00Z'
          }
        ]
      };
      
      setSelectedUser(mockUserInfo);
      setUserInfoModalVisible(true);
    } catch (error) {
      message.error('Ошибка при загрузке информации о пользователе');
    }
  };

  const handleUserActionsClick = async (record: SupportRequest) => {
    try {
      // Здесь нужно будет добавить API для получения действий пользователя
      const mockUserActions: UserAction[] = [
        {
          id: 1,
          action: 'Просмотр объекта',
          details: 'Пользователь просмотрел объект недвижимости ID: 123',
          timestamp: '2024-01-15T10:30:00Z',
          severity: 'info'
        },
        {
          id: 2,
          action: 'Ошибка при загрузке',
          details: 'Ошибка 404 при попытке загрузить изображение объекта',
          timestamp: '2024-01-15T10:25:00Z',
          error: 'Failed to load image: 404 Not Found',
          severity: 'error'
        },
        {
          id: 3,
          action: 'Создание запроса поддержки',
          details: 'Пользователь создал запрос в службу поддержки',
          timestamp: '2024-01-15T10:20:00Z',
          severity: 'info'
        }
      ];
      
      setSelectedUserActions(mockUserActions);
      setUserActionsModalVisible(true);
    } catch (error) {
      message.error('Ошибка при загрузке действий пользователя');
    }
  };

  // Функции для авторизации агентства
  const handleAuthorizationDetailsClick = async (user: any) => {
    try {
      const details = await getAgencyAuthorizationDetails(user.id);
      setSelectedAuthorization(details);
      setAuthorizationDetailsModalVisible(true);
    } catch (error) {
      message.error('Ошибка при загрузке деталей заявки');
    }
  };

  const handleApproveAuthorization = async (userId: number) => {
    try {
      await approveAgencyAuthorization(userId);
      message.success('Заявка одобрена');
      setAuthorizationDetailsModalVisible(false);
      setSelectedAuthorization(null);
      loadData();
    } catch (error) {
      message.error('Ошибка при одобрении заявки');
    }
  };

  const handleRejectAuthorization = async (values: { reason: string }) => {
    if (!selectedAuthorization) return;
    
    try {
      await rejectAgencyAuthorization(selectedAuthorization.user.id, values.reason);
      message.success('Заявка отклонена');
      setRejectModalVisible(false);
      setAuthorizationDetailsModalVisible(false);
      setSelectedAuthorization(null);
      rejectForm.resetFields();
      loadData();
    } catch (error) {
      message.error('Ошибка при отклонении заявки');
    }
  };

  // Подсчитываем непросмотренные запросы для каждой вкладки
  const unviewedActiveCount = requests.filter(req => !viewedActiveRequests.has(req.id)).length;
  const unviewedArchivedCount = archivedRequests.filter(req => !viewedArchivedRequests.has(req.id)).length;

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="orange" icon={<ClockCircleOutlined />}>Ожидает</Tag>;
      case 'in_progress':
        return <Tag color="blue" icon={<ClockCircleOutlined />}>В работе</Tag>;
      case 'resolved':
        return <Tag color="green" icon={<CheckCircleOutlined />}>Решено</Tag>;
      case 'closed':
        return <Tag color="red" icon={<CloseCircleOutlined />}>Закрыто</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
      width: 120,
    },
    {
      title: 'Клиент',
      key: 'client',
      render: (record: SupportRequest) => (
        <div>
          <div><strong>{record.lastName} {record.firstName} {record.middleName}</strong></div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            <PhoneOutlined /> {record.phone}
          </div>
        </div>
      ),
    },
    {
      title: 'Проблема',
      dataIndex: 'problem',
      key: 'problem',
      render: (problem: string, record: SupportRequest) => (
        <div style={{ maxWidth: 300 }}>
          <Text 
            ellipsis={{ tooltip: problem }}
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => handleRequestClick(record)}
          >
            {problem}
          </Text>
        </div>
      ),
    },
    {
      title: 'Дата создания',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('ru-RU'),
      width: 150,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (record: SupportRequest) => (
        <Space>
          {record.status === 'pending' && (
            <Button 
              type="primary" 
              size="small"
              onClick={() => handleAssign(record.id)}
            >
              Взять в работу
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button 
              type="primary" 
              size="small"
              icon={<MessageOutlined />}
              onClick={() => {
                setSelectedRequest(record);
                setResolveModalVisible(true);
              }}
            >
              Решить
            </Button>
          )}
          {record.status === 'resolved' && (
            <Button 
              type="default" 
              size="small"
              onClick={() => handleClose(record.id)}
            >
              Закрыть
            </Button>
          )}
          <Button 
            type="default" 
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => handleUserInfoClick(record)}
            title="Информация о пользователе"
          />
          <Button 
            type="default" 
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => handleUserActionsClick(record)}
            title="Действия пользователя"
          />
        </Space>
      ),
      width: 200,
    },
  ];

  const renderRequestsTable = (dataSource: SupportRequest[]) => (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey="id"
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
    />
  );

  // Колонки для таблицы авторизации агентства
  const authorizationColumns = [
    {
      title: 'Пользователь',
      key: 'user',
      render: (record: any) => (
        <div>
          <div><strong>{record.lastName} {record.firstName} {record.middleName}</strong></div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            {record.email}
          </div>
        </div>
      ),
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleLabels: Record<string, string> = {
          'director': 'Директор',
          'agent': 'Агент',
          'manager': 'Руководитель',
          'private_realtor': 'Частный риэлтор',
        };
        return <Tag color="blue">{roleLabels[role] || role}</Tag>;
      },
    },
    {
      title: 'Агентство',
      key: 'agency',
      render: (record: any) => (
        <div>
          {record.agency ? (
            <div>
              <div><strong>{record.agency.name}</strong></div>
              {record.agency.logo && (
                <img 
                  src={record.agency.logo} 
                  alt="Логотип" 
                  style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 4 }}
                />
              )}
            </div>
          ) : (
            <span style={{ color: '#999' }}>Не указано</span>
          )}
        </div>
      ),
    },
    {
      title: 'Дата регистрации',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('ru-RU'),
      width: 150,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Button 
            type="primary" 
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => handleAuthorizationDetailsClick(record)}
          >
            Просмотр
          </Button>
        </Space>
      ),
      width: 120,
    },
  ];

  const renderAuthorizationTable = () => (
    <Table
      columns={authorizationColumns}
      dataSource={pendingAuthorizations}
      rowKey="id"
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
    />
  );

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Панель службы поддержки</Title>
      
      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Всего запросов"
              value={stats.total || 0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Ожидают"
              value={stats.pending || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="В работе"
              value={stats.inProgress || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Решено"
              value={stats.resolved || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Таблица запросов с вкладками */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Запросы в службу поддержки</span>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              loading={loading}
            >
              Обновить
            </Button>
          </div>
        }
      >
        <Tabs defaultActiveKey="active" onChange={handleTabChange}>
          <TabPane 
            tab={
              <span>
                <MessageOutlined />
                Активные запросы
                {unviewedActiveCount > 0 && (
                  <Badge count={unviewedActiveCount} style={{ marginLeft: 8 }} />
                )}
              </span>
            } 
            key="active"
          >
            {renderRequestsTable(requests)}
          </TabPane>
          <TabPane 
            tab={
              <span>
                <FileTextOutlined />
                Архив
                {unviewedArchivedCount > 0 && (
                  <Badge count={unviewedArchivedCount} style={{ marginLeft: 8 }} />
                )}
              </span>
            } 
            key="archived"
          >
            {renderRequestsTable(archivedRequests)}
          </TabPane>
          <TabPane 
            tab={
              <span>
                <HomeOutlined />
                Авторизация агентства
                {pendingAuthorizations.length > 0 && (
                  <Badge count={pendingAuthorizations.length} style={{ marginLeft: 8 }} />
                )}
              </span>
            } 
            key="authorization"
          >
            {renderAuthorizationTable()}
          </TabPane>
        </Tabs>
      </Card>

      {/* Модальное окно для решения запроса */}
      <Modal
        title="Решение запроса"
        open={resolveModalVisible}
        onCancel={() => {
          setResolveModalVisible(false);
          setSelectedRequest(null);
          resolveForm.resetFields();
        }}
        footer={null}
      >
        <Form form={resolveForm} onFinish={handleResolve} layout="vertical">
          <Form.Item
            name="resolution"
            label="Решение проблемы"
            rules={[{ required: true, message: 'Введите решение проблемы' }]}
          >
            <TextArea rows={4} placeholder="Опишите решение проблемы..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Отметить как решенное
              </Button>
              <Button onClick={() => {
                setResolveModalVisible(false);
                setSelectedRequest(null);
                resolveForm.resetFields();
              }}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно с информацией о пользователе */}
      <Modal
        title="Информация о пользователе"
        open={userInfoModalVisible}
        onCancel={() => setUserInfoModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedUser && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Avatar size={64} src={selectedUser.photo} icon={<UserOutlined />} />
              </Col>
              <Col span={16}>
                <Title level={4}>{selectedUser.firstName} {selectedUser.lastName} {selectedUser.middleName}</Title>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Телефон:</strong> {selectedUser.phone}</p>
                <p><strong>Роль:</strong> {selectedUser.role}</p>
                <p><strong>Агентство:</strong> {selectedUser.agency}</p>
              </Col>
            </Row>
            
            <Divider />
            
            <Title level={5}>Контакты</Title>
            <p><strong>Telegram:</strong> {selectedUser.telegramUsername || 'Не указан'}</p>
            <p><strong>WhatsApp:</strong> {selectedUser.whatsappNumber || 'Не указан'}</p>
            
            <Divider />
            
            <Title level={5}>Активные сессии</Title>
            {selectedUser.activeSessions && selectedUser.activeSessions.length > 0 ? (
              <List
                dataSource={selectedUser.activeSessions}
                renderItem={(session) => (
                  <List.Item>
                    <div>
                      <p><strong>Устройство:</strong> {session.deviceInfo}</p>
                      <p><strong>IP адрес:</strong> {session.ipAddress}</p>
                      <p><strong>Последняя активность:</strong> {new Date(session.lastActivity).toLocaleString('ru-RU')}</p>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <p>Нет активных сессий</p>
            )}
          </div>
        )}
      </Modal>

      {/* Модальное окно с действиями пользователя */}
      <Modal
        title="Действия пользователя"
        open={userActionsModalVisible}
        onCancel={() => setUserActionsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Timeline>
          {selectedUserActions.map((action) => (
            <Timeline.Item
              key={action.id}
              color={action.severity === 'error' ? 'red' : action.severity === 'warning' ? 'orange' : 'blue'}
            >
              <p><strong>{action.action}</strong></p>
              <p>{action.details}</p>
              {action.error && (
                <p style={{ color: '#ff4d4f', fontFamily: 'monospace' }}>{action.error}</p>
              )}
              <p style={{ fontSize: '12px', color: '#666' }}>
                {new Date(action.timestamp).toLocaleString('ru-RU')}
              </p>
            </Timeline.Item>
          ))}
        </Timeline>
      </Modal>

      {/* Модальное окно с деталями авторизации агентства */}
      <Modal
        title="Детали заявки на авторизацию"
        open={authorizationDetailsModalVisible}
        onCancel={() => setAuthorizationDetailsModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedAuthorization && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ marginBottom: 8, textAlign: 'center' }}>
                  {selectedAuthorization.user.photo ? (
                    <img
                      src={selectedAuthorization.user.photo}
                      alt="Аватар пользователя"
                      style={{ width: 96, height: 96, borderRadius: 16, objectFit: 'cover', marginBottom: 4, border: '1px solid #eee' }}
                    />
                  ) : (
                    <UserOutlined style={{ fontSize: 96, color: '#ccc', marginBottom: 4 }} />
                  )}
                  <div style={{ fontSize: 12, color: '#888' }}>Аватар пользователя</div>
                </div>
                {selectedAuthorization.agency && selectedAuthorization.agency.logo && (
                  <div style={{ textAlign: 'center' }}>
                    <Avatar
                      size={64}
                      src={selectedAuthorization.agency.logo}
                      style={{ background: '#fff', border: '1px solid #eee', marginBottom: 4 }}
                      onError={() => false}
                    />
                    <div style={{ fontSize: 12, color: '#888' }}>Логотип агентства</div>
                  </div>
                )}
              </Col>
              <Col span={16}>
                <Title level={4}>
                  {selectedAuthorization.user.firstName} {selectedAuthorization.user.lastName} {selectedAuthorization.user.middleName}
                </Title>
                <p><strong>Email:</strong> {selectedAuthorization.user.email}</p>
                <p><strong>Телефон:</strong> {selectedAuthorization.user.phone}</p>
                <p><strong>Роль:</strong> {selectedAuthorization.user.role}</p>
                <p><strong>Дата регистрации:</strong> {new Date(selectedAuthorization.user.createdAt).toLocaleString('ru-RU')}</p>
              </Col>
            </Row>
            
            <Divider />
            
            <Title level={5}>Контакты</Title>
            <p><strong>Telegram:</strong> {selectedAuthorization.user.telegramUsername || 'Не указан'}</p>
            <p><strong>WhatsApp:</strong> {selectedAuthorization.user.whatsappNumber || 'Не указан'}</p>
            
            {selectedAuthorization.agency && (
              <>
                <Divider />
                <Title level={5}>Агентство</Title>
                <p><strong>Название:</strong> {selectedAuthorization.agency.name}</p>
                {selectedAuthorization.agency.logo && (
                  <div>
                    <p><strong>Логотип:</strong></p>
                    <img 
                      src={selectedAuthorization.agency.logo} 
                      alt="Логотип агентства" 
                      style={{ maxWidth: 200, maxHeight: 100, objectFit: 'contain' }}
                    />
                  </div>
                )}
              </>
            )}
            
            {selectedAuthorization.user.documents && selectedAuthorization.user.documents.length > 0 && (
              <>
                <Divider />
                <Title level={5}>Документы</Title>
                <List
                  dataSource={selectedAuthorization.user.documents}
                  renderItem={(doc: string, index: number) => (
                    <List.Item>
                      <div>
                        <p><strong>Документ {index + 1}:</strong></p>
                        <a 
                          href={doc} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            // Проверяем, что ссылка не пустая
                            if (!doc || doc === 'null' || doc === 'undefined') {
                              e.preventDefault();
                              message.error('Файл недоступен');
                              return false;
                            }
                          }}
                        >
                          Просмотреть документ
                        </a>
                      </div>
                    </List.Item>
                  )}
                />
              </>
            )}
            
            {selectedAuthorization.endorsements && selectedAuthorization.endorsements.length > 0 && (
              <>
                <Divider />
                <Title level={5}>Поручительства (для частного риэлтора)</Title>
                <List
                  dataSource={selectedAuthorization.endorsements}
                  renderItem={(endorsement: any) => (
                    <List.Item>
                      <div>
                        <p><strong>Агентство:</strong> {endorsement.agency.name}</p>
                        <p><strong>Статус:</strong> {endorsement.status}</p>
                        <p><strong>Дата:</strong> {new Date(endorsement.createdAt).toLocaleString('ru-RU')}</p>
                      </div>
                    </List.Item>
                  )}
                />
              </>
            )}
            
            <Divider />
            
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Space>
                <Button 
                  type="primary" 
                  size="large"
                  onClick={() => handleApproveAuthorization(selectedAuthorization.user.id)}
                >
                  Одобрить заявку
                </Button>
                <Button 
                  type="default" 
                  size="large"
                  danger
                  onClick={() => setRejectModalVisible(true)}
                >
                  Отклонить заявку
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>

      {/* Модальное окно для отклонения заявки */}
      <Modal
        title="Отклонение заявки"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <p>Вы собираетесь отклонить заявку пользователя:</p>
          <p><strong>{selectedAuthorization?.user?.firstName} {selectedAuthorization?.user?.lastName} {selectedAuthorization?.user?.middleName}</strong></p>
          <p><strong>Email:</strong> {selectedAuthorization?.user?.email}</p>
          <p><strong>Роль:</strong> {selectedAuthorization?.user?.role}</p>
        </div>
        
        <Form form={rejectForm} onFinish={handleRejectAuthorization}>
          <Form.Item
            name="reason"
            label="Причина отклонения"
            rules={[
              { required: true, message: 'Укажите причину отклонения' },
              { min: 10, message: 'Причина должна содержать минимум 10 символов' }
            ]}
          >
            <TextArea 
              rows={4} 
              placeholder="Укажите подробную причину отклонения заявки..." 
              maxLength={500}
              showCount
            />
          </Form.Item>
          <Form.Item style={{ textAlign: 'center', marginTop: 24 }}>
            <Space>
              <Button type="default" onClick={() => setRejectModalVisible(false)}>
                Отмена
              </Button>
              <Button 
                type="primary" 
                danger 
                htmlType="submit"
                icon={<ExclamationCircleOutlined />}
              >
                Отклонить заявку
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupportDashboardPage; 