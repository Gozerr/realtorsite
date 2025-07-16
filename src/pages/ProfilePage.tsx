import React, { useContext, useEffect, useState, useRef } from 'react';
import { 
  Card, 
  Avatar, 
  Typography, 
  Button, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  message,
  AutoComplete,
  Tabs,
  Statistic,
  Row,
  Col,
  Spin,
  Upload
} from 'antd';
import { 
  UserOutlined, 
  EditOutlined, 
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  UploadOutlined,
  CameraOutlined
} from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';
import { updateProfile, getProfile } from '../services/auth.service';
import { getPropertiesByAgent } from '../services/property.service';
import { getClientsByAgent } from '../services/client.service';
import cities from '../data/cities.json';
import { getCityByIP } from '../utils/geocode';
import { uploadAvatar } from '../services/upload.service';

const { Title } = Typography;
const { TabPane } = Tabs;

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({ firstName: '', lastName: '', middleName: '', email: '', phone: '', city: '', region: '', whatsappNumber: '', telegramUsername: '', photo: '' });
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [avatarHover, setAvatarHover] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm] = Form.useForm();
  const [changingPassword, setChangingPassword] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [cityInput, setCityInput] = useState('');
  const [cityOptions, setCityOptions] = useState<{ value: string }[]>([]);
  const [activeTab, setActiveTab] = useState('general');
  const [properties, setProperties] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  // useRef должен быть на верхнем уровне компонента, до любых условий
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setEditValues({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        middleName: user.middleName || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
        region: user.region || '',
        whatsappNumber: user.whatsappNumber || '',
        telegramUsername: user.telegramUsername || '',
        photo: user.photo || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (user && !user.city) {
      (async () => {
        const city = await getCityByIP();
        if (city) {
          setDetectedCity(city);
          setCityInput(city);
        }
        setCityModalOpen(true);
      })();
    }
  }, [user]);

  useEffect(() => {
    if (!cityInput) {
      setCityOptions([]);
      return;
    }
    const filtered = (cities as any[])
      .filter(c => c.name && c.name.toLowerCase().includes(cityInput.toLowerCase()))
      .slice(0, 20)
      .map(c => ({ value: c.name }));
    setCityOptions(filtered);
  }, [cityInput]);

  useEffect(() => {
    if (user && activeTab === 'stats') {
      setStatsLoading(true);
      setStatsError(null);
      // Надежный способ: сначала пробуем stats-эндпоинт, если не работает — fallback на старые методы
      fetch(`/api/properties/agent/${user.id}/stats`)
        .then(async (res) => {
          if (!res.ok) throw new Error('stats endpoint failed');
          return res.json();
        })
        .then(setStats)
        .catch(async () => {
          // fallback: старый способ
          try {
            const [props, clis] = await Promise.all([
              getPropertiesByAgent(user.id),
              getClientsByAgent(user.id)
            ]);
            setStats({
              total: props.length,
              forSale: props.filter((p: any) => p.status === 'for_sale').length,
              sold: props.filter((p: any) => p.status === 'sold').length,
              exclusive: props.filter((p: any) => p.isExclusive).length,
              clients: clis.length
            });
          } catch (e) {
            setStatsError('Не удалось загрузить статистику');
          }
        })
        .finally(() => setStatsLoading(false));
    }
  }, [user, activeTab]);

  const handleCityConfirm = async (city: string) => {
    const cityObj = (cities as any[]).find(c => c.name === city);
    const region = cityObj && cityObj.region && cityObj.region.name ? cityObj.region.name : '';
    try {
      await updateProfile({ city, region });
      if (authContext?.token) {
        const freshProfile = await getProfile(authContext.token);
        authContext.setAuthData(authContext.token, freshProfile);
        localStorage.setItem('user', JSON.stringify(freshProfile));
      }
      setCityModalOpen(false);
      message.success('Город и область успешно сохранены!');
    } catch {
      message.error('Ошибка при сохранении города');
    }
  };

  if (authContext && authContext.user === undefined) {
    return <div style={{ padding: 32 }}>Загрузка...</div>;
  }
  if (!user) {
    return <div style={{ padding: 32 }}>Ошибка загрузки профиля. Попробуйте перезайти.</div>;
  }

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setEditValues({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        middleName: user.middleName || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
        region: user.region || '',
        whatsappNumber: user.whatsappNumber || '',
        telegramUsername: user.telegramUsername || '',
        photo: user.photo || '',
      });
    }
  };
  const handleSave = async () => {
    try {
      await updateProfile(editValues);
      if (authContext?.token) {
        const freshProfile = await getProfile(authContext.token);
        authContext.setAuthData(authContext.token, freshProfile);
        localStorage.setItem('user', JSON.stringify(freshProfile));
      }
      message.success('Профиль обновлён!');
      setIsEditing(false);
    } catch {
      message.error('Ошибка при обновлении профиля');
    }
  };
  const handlePasswordChange = async () => {
    try {
      setChangingPassword(true);
      const values = await passwordForm.validateFields();
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authContext?.token}` },
        body: JSON.stringify({ oldPassword: values.oldPassword, newPassword: values.newPassword }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка при смене пароля');
      }
      message.success('Пароль успешно изменён');
      setPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (e: any) {
      message.error(e.message || 'Ошибка при смене пароля');
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'agent': return 'Агент';
      case 'director': return 'Директор';
      case 'manager': return 'Менеджер';
      case 'private_realtor': return 'Частный риэлтор';
      case 'support': return 'Служба поддержки';
      default: return role;
    }
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'pending': return 'Ожидает';
      case 'banned': return 'Заблокирован';
      default: return status;
    }
  };
  const getDocumentStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Проверено';
      case 'pending_review': return 'На проверке';
      case 'rejected': return 'Отклонено';
      case 'needs_revision': return 'Требует доработки';
      default: return status;
    }
  };
  const documentStatus = user.documentStatus || 'pending_review';
  const documentStatusColor =
    documentStatus === 'approved' ? 'green' :
    documentStatus === 'pending_review' ? 'orange' :
    documentStatus === 'rejected' ? 'red' : 'default';
  let avatarSrc = user?.photo || user?.avatar || undefined;
  // Не подставлять /avatars/ вручную, просто используем user.photo

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Исправленный handleAvatarChange
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('photo', file);
      // Добавим остальные поля профиля, чтобы не терять их при обновлении
      Object.entries(editValues).forEach(([key, value]) => {
        if (key !== 'photo') formData.append(key, value as string);
      });
      console.log('Отправка PATCH /users/profile с FormData:', Array.from(formData.entries()));
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        body: formData,
        credentials: 'include',
        headers: authContext?.token ? { Authorization: `Bearer ${authContext.token}` } : undefined,
      });
      if (!response.ok) throw new Error('Ошибка при обновлении профиля');
      const updatedUser = await response.json();
      setEditValues(v => ({ ...v, photo: updatedUser.photo }));
      if (authContext?.setAuthData && authContext.token) {
        authContext.setAuthData(authContext.token, updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      message.success('Фото успешно обновлено!');
      console.log('Фото профиля обновлено:', updatedUser.photo);
    } catch (err) {
      message.error('Ошибка при загрузке фото');
      console.error('Ошибка при загрузке фото:', err);
    }
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f6faff', padding: '32px 0' }}>
      <Card style={{ width: '100%', maxWidth: 520, borderRadius: 24, boxShadow: '0 4px 24px #e6eaf1', background: '#fff', padding: 0 }} bodyStyle={{ padding: 32 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} centered size="large">
          <TabPane tab="Общие данные" key="general">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Аватар профиля */}
              <div style={{ position: 'relative', cursor: isEditing ? 'pointer' : 'default', width: 120, height: 120, margin: '0 auto' }} onClick={handleAvatarClick}>
                <img
                  src={isEditing ? editValues.photo || user.photo : user.photo}
                  alt="avatar"
                  style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }}
                />
                {isEditing && (
                  <span style={{ position: 'absolute', bottom: 8, right: 8, background: '#fff', borderRadius: '50%', padding: 4, boxShadow: '0 0 4px #ccc' }}>
                    <EditOutlined />
          </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
                    </div>
              <Title level={3} style={{ margin: 0, color: '#2d3652', fontWeight: 700, fontSize: 26, textAlign: 'center' }}>
                {user.lastName} {user.firstName} {user.middleName}
                  </Title>
              <div style={{ marginTop: 8, marginBottom: 8 }}>
                    <Tag color="blue" icon={<TeamOutlined />}>{getRoleLabel(user.role)}</Tag>
                    <Tag color="green" icon={<CheckCircleOutlined />}>{getStatusLabel(user.status || 'active')}</Tag>
                <Tag color={documentStatusColor} icon={<SafetyCertificateOutlined />}>{getDocumentStatusLabel(documentStatus)}</Tag>
                    {user.agency && (
                  <Tag color="purple" icon={<UserOutlined />}>{user.agency.name}</Tag>
                )}
                      </div>
              {isEditing ? (
                <Form layout="vertical" style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
                  {/* Удаляю Form.Item с Upload-кнопкой, теперь загрузка только через клик по аватару */}
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item label="Фамилия" required>
                        <Input value={editValues.lastName} onChange={e => setEditValues(v => ({ ...v, lastName: e.target.value }))} />
                      </Form.Item>
                      <Form.Item label="Имя" required>
                        <Input value={editValues.firstName} onChange={e => setEditValues(v => ({ ...v, firstName: e.target.value }))} />
                      </Form.Item>
                      <Form.Item label="Отчество">
                        <Input value={editValues.middleName} onChange={e => setEditValues(v => ({ ...v, middleName: e.target.value }))} />
                      </Form.Item>
                      <Form.Item label="Email" required>
                        <Input value={editValues.email} onChange={e => setEditValues(v => ({ ...v, email: e.target.value }))} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label="Телефон">
                        <Input value={editValues.phone} onChange={e => setEditValues(v => ({ ...v, phone: e.target.value }))} />
                      </Form.Item>
                      <Form.Item label="Город">
                        <Input value={editValues.city} onChange={e => setEditValues(v => ({ ...v, city: e.target.value }))} />
                      </Form.Item>
                      <Form.Item label="Регион">
                        <Input value={editValues.region} onChange={e => setEditValues(v => ({ ...v, region: e.target.value }))} />
                      </Form.Item>
                      <Form.Item label="WhatsApp номер">
                        <Input value={editValues.whatsappNumber || ''} onChange={e => setEditValues(v => ({ ...v, whatsappNumber: e.target.value }))} />
                      </Form.Item>
                      <Form.Item label="Telegram username">
                        <Input value={editValues.telegramUsername || ''} onChange={e => setEditValues(v => ({ ...v, telegramUsername: e.target.value }))} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                    <Button type="primary" onClick={handleSave}>Сохранить</Button>
                    <Button onClick={handleCancel}>Отмена</Button>
                  </div>
                </Form>
              ) : (
                <>
                  <div style={{ width: '100%', margin: '18px 0' }}>
                    <div style={{ color: '#888', marginBottom: 6 }}><MailOutlined style={{ marginRight: 8 }} />{user.email}</div>
                    <div style={{ color: '#888', marginBottom: 6 }}><PhoneOutlined style={{ marginRight: 8 }} />{user.phone || '—'}</div>
                    <div style={{ color: '#888', marginBottom: 6 }}><EnvironmentOutlined style={{ marginRight: 8 }} />{user.city || '—'}, {user.region || '—'}</div>
                    <div style={{ color: '#888', marginBottom: 6, display: 'flex', alignItems: 'center' }}>
                      <img src="/telegram-icon.svg" alt="Telegram" style={{ width: 22, height: 22, marginRight: 8 }} />
                      {user.telegramUsername ? (
                        <a href={`https://t.me/${user.telegramUsername.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 500 }}>
                          @{user.telegramUsername.replace(/^@/, '')}
                        </a>
                      ) : '—'}
                    </div>
                    <div style={{ color: '#888', marginBottom: 6, display: 'flex', alignItems: 'center' }}>
                      <img src="/whatsapp-icon.svg" alt="WhatsApp" style={{ width: 22, height: 22, marginRight: 8 }} />
                      {user.whatsappNumber ? (
                        <a href={`https://wa.me/${user.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#25d366', fontWeight: 500 }}>
                          {user.whatsappNumber}
                        </a>
                      ) : '—'}
                    </div>
                    <div style={{ color: '#888', marginBottom: 6 }}><span style={{ marginRight: 8, color: '#aaa' }}>Зарегистрирован:</span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '—'}</div>
                    <div style={{ color: '#888', marginBottom: 6 }}><span style={{ marginRight: 8, color: '#aaa' }}>Последний вход:</span>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ru-RU') : '—'}</div>
    </div>
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8, marginBottom: 8 }}>
                    <Button type="default" icon={<LockOutlined />} style={{ minWidth: 140, height: 40, fontSize: 15, borderRadius: 10, fontWeight: 500 }} onClick={() => setPasswordModalOpen(true)}>
                      Сменить пароль
                    </Button>
                    <Button type="primary" icon={<EditOutlined />} style={{ minWidth: 140, height: 44, fontSize: 16, borderRadius: 14, fontWeight: 600, boxShadow: '0 2px 12px #b3c6e0' }} onClick={handleEdit}>
                      Редактировать
                    </Button>
                  </div>
                </>
                  )}
                </div>
          </TabPane>
          <TabPane tab="Статистика" key="stats">
            {activeTab === 'stats' && (
              <div style={{ minHeight: 200, width: '100%' }}>
                {statsLoading ? <Spin /> : statsError ? (
                  <div style={{ color: 'red', textAlign: 'center', margin: 24 }}>{statsError}</div>
                ) : stats ? (
                  <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={8}><Statistic title="Всего объектов" value={stats.total} /></Col>
                    <Col span={8}><Statistic title="На продаже" value={stats.forSale} /></Col>
                    <Col span={8}><Statistic title="Продано" value={stats.sold} /></Col>
                    <Col span={8}><Statistic title="Эксклюзивы" value={stats.exclusive} /></Col>
                    <Col span={8}><Statistic title="Клиенты" value={stats.clients} /></Col>
                  </Row>
                ) : null}
              </div>
            )}
          </TabPane>
        </Tabs>
            </Card>

                {/* Модальное окно смены пароля */}
                <Modal
                  open={passwordModalOpen}
                  title="Смена пароля"
                  onCancel={() => setPasswordModalOpen(false)}
        onOk={async () => { await handlePasswordChange(); }}
                  okText="Сменить пароль"
                  confirmLoading={changingPassword}
                  cancelText="Отмена"
                >
                  <Form form={passwordForm} layout="vertical">
          <Form.Item name="oldPassword" label="Старый пароль" rules={[{ required: true, message: 'Введите старый пароль' }]}>  <Input.Password prefix={<LockOutlined />} placeholder="Введите текущий пароль" iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)} />
            </Form.Item>
          <Form.Item name="newPassword" label="Новый пароль" rules={[{ required: true, message: 'Введите новый пароль' }, { min: 8, message: 'Пароль должен содержать минимум 8 символов' }]}>  <Input.Password prefix={<LockOutlined />} placeholder="Введите новый пароль" iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)} />
            </Form.Item>
          <Form.Item name="confirmPassword" label="Повторите новый пароль" dependencies={["newPassword"]} rules={[{ required: true, message: 'Повторите новый пароль' }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue('newPassword') === value) { return Promise.resolve(); } return Promise.reject(new Error('Пароли не совпадают')); }, })]}>  <Input.Password prefix={<LockOutlined />} placeholder="Повторите новый пароль" iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)} />
                    </Form.Item>
                  </Form>
                </Modal>

      {/* Модальное окно выбора города */}
      <Modal
        open={cityModalOpen}
        title="Укажите ваш город"
        closable={false}
        footer={null}
        maskClosable={false}
      >
        {detectedCity ? (
          <div style={{ marginBottom: 16 }}>
            Ваш город определён как <b>{detectedCity}</b>.<br />
            <Button type="primary" style={{ marginTop: 12, marginRight: 8 }} onClick={() => handleCityConfirm(detectedCity!)}>Да, это мой город</Button>
            <Button style={{ marginTop: 12 }} onClick={() => setDetectedCity(null)}>Нет, выбрать другой</Button>
          </div>
        ) : null}
        {!detectedCity && (
          <div>
            <div style={{ marginBottom: 8 }}>Выберите город из списка:</div>
            <AutoComplete
              options={cityOptions}
              value={cityInput}
              onChange={setCityInput}
              onSelect={val => setCityInput(val)}
              placeholder="Начните вводить название города"
              style={{ width: '100%', marginBottom: 12 }}
              filterOption={false}
            />
            <Button type="primary" block disabled={!cityInput} onClick={() => handleCityConfirm(cityInput)}>
              Сохранить город
            </Button>
              </div>
        )}
      </Modal>
    </div>
  );
} 