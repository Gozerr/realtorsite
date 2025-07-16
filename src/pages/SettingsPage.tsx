import React, { useState, useContext, useEffect } from 'react';
import { Tabs, Input, Button, Switch, Select, Card, Typography, Checkbox, message } from 'antd';
import { AuthContext } from '../context/AuthContext';
import { getUserNotificationSettings, updateUserNotificationSettings } from '../services/notification.service';
import { updateProfile } from '../services/auth.service';
import { User } from '../types';
import { getCityByIP } from '../utils/geocode';
import styles from '../components/AppLayout.module.css';

const { Title, Text } = Typography;

const cardStyle = {
  width: '100%',
  maxWidth: '100%',
  borderRadius: 24,
  boxShadow: '0 4px 32px #e6eaf1',
  background: 'linear-gradient(135deg, #f7faff 60%, #e3f0ff 100%)',
  padding: 32,
  border: 'none',
  marginBottom: 32,
};

const generalTab = (user: Partial<User>, setUser: React.Dispatch<React.SetStateAction<Partial<User>>>, setAuthData: ((token: string | null, user: User | null) => void) | undefined) => (
  <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
    <Title level={3} style={{ marginBottom: 8, fontWeight: 700, letterSpacing: 0.5 }}>Общие настройки</Title>
    <Text type="secondary" style={{ fontSize: 16 }}>Управляйте основными настройками вашего аккаунта</Text>
    <div style={{ marginTop: 32 }}>
      <div style={{ marginBottom: 16, fontWeight: 500 }}>Город</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
        <Input
          value={user.city || ''}
          onChange={e => setUser((prev: any) => ({ ...prev, city: e.target.value }))}
          placeholder="Ваш город"
          style={{ width: 200 }}
          size="large"
        />
        <Button 
          onClick={async () => {
            const city = await getCityByIP();
            if (city) {
              setUser((prev: any) => ({ ...prev, city }));
              message.success(`Определён город: ${city}`);
            } else {
              message.error('Не удалось определить город по IP');
            }
          }}
          style={{ borderRadius: 8 }}
        >
          Определить по IP
        </Button>
      </div>
      <div style={{ marginBottom: 16, fontWeight: 500 }}>Язык интерфейса</div>
      <Select defaultValue="Русский" style={{ width: 260, marginBottom: 20 }} size="large">
        <Select.Option value="Русский">Русский</Select.Option>
        <Select.Option value="English">English</Select.Option>
      </Select>
      <div style={{ marginBottom: 16, fontWeight: 500 }}>Часовой пояс</div>
      <Select defaultValue="Москва (GMT+3)" style={{ width: 260, marginBottom: 20 }} size="large">
        <Select.Option value="Москва (GMT+3)">Москва (GMT+3)</Select.Option>
        <Select.Option value="Калининград (GMT+2)">Калининград (GMT+2)</Select.Option>
      </Select>
      <div style={{ marginBottom: 16, fontWeight: 500 }}>Формат даты</div>
      <Input defaultValue="ДД.MM.ГГГГ" style={{ width: 260, marginBottom: 32 }} size="large" />
      <Button type="primary" size="large" style={{ borderRadius: 12, fontWeight: 600 }} onClick={async () => {
        const updated = await updateProfile({ city: user.city });
        if (setAuthData) {
          setAuthData(localStorage.getItem('token'), updated);
        }
        message.success('Город обновлён');
      }}>Сохранить изменения</Button>
    </div>
  </Card>
);

const notificationCategories = [
  { key: 'property', label: 'Изменения по объектам недвижимости' },
  { key: 'education', label: 'Обучающие события и напоминания' },
  { key: 'system', label: 'Системные обновления' },
];

function NotificationSettingsTab() {
  const auth = useContext(AuthContext);
  const userId = auth?.user?.id;
  const [checked, setChecked] = React.useState<{ [key: string]: boolean }>({
    property: true,
    education: true,
    system: true,
  });
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getUserNotificationSettings(userId)
      .then(data => setChecked({
        property: data.property,
        education: data.education,
        system: data.system,
      }))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleChange = (key: string, value: boolean) => {
    setChecked(prev => ({ ...prev, [key]: value }));
  };
  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    await updateUserNotificationSettings(userId, checked);
    setSaving(false);
    message.success('Настройки уведомлений сохранены');
  };

  return (
    <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
      <Title level={3} style={{ marginBottom: 8, fontWeight: 700, letterSpacing: 0.5 }}>Настройки уведомлений</Title>
      <Text type="secondary" style={{ fontSize: 16 }}>Выберите, какие уведомления вы хотите получать</Text>
      <div style={{ marginTop: 32 }}>
        {notificationCategories.map(cat => (
          <div key={cat.key} style={{ marginBottom: 20, fontWeight: 500, fontSize: 16 }}>
            <Checkbox
              checked={checked[cat.key]}
              onChange={e => handleChange(cat.key, e.target.checked)}
              disabled={loading}
            >
              {cat.label}
            </Checkbox>
          </div>
        ))}
        <Button type="primary" size="large" style={{ borderRadius: 12, fontWeight: 600 }} loading={saving} onClick={handleSave} disabled={loading}>
          Сохранить изменения
        </Button>
      </div>
    </Card>
  );
}

const appearanceTab = (
  <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
    <Title level={3} style={{ marginBottom: 8, fontWeight: 700, letterSpacing: 0.5 }}>Внешний вид</Title>
    <Text type="secondary" style={{ fontSize: 16 }}>Настройте внешний вид приложения</Text>
    <div style={{ marginTop: 32 }}>
      <div style={{ marginBottom: 16, fontWeight: 500 }}>Темная тема <Switch style={{ marginLeft: 8 }} /></div>
      <div style={{ marginBottom: 16, fontWeight: 500 }}>Размер шрифта</div>
      <Select defaultValue="Средний" style={{ width: 260, marginBottom: 20 }} size="large">
        <Select.Option value="Мелкий">Мелкий</Select.Option>
        <Select.Option value="Средний">Средний</Select.Option>
        <Select.Option value="Крупный">Крупный</Select.Option>
      </Select>
      <div style={{ marginBottom: 16, marginTop: 16, fontWeight: 500 }}>Предпросмотр</div>
      <div style={{ color: '#888' }}>Текст мелкого размера</div>
      <div>Текст среднего размера</div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>Текст крупного размера</div>
      <div style={{ fontWeight: 700, fontSize: 22, marginTop: 8 }}>Заголовок</div>
      <Button type="primary" size="large" style={{ marginTop: 24, borderRadius: 12, fontWeight: 600 }}>Сохранить изменения</Button>
    </div>
  </Card>
);

const apiTab = (
  <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
    <Title level={3} style={{ marginBottom: 8, fontWeight: 700, letterSpacing: 0.5 }}>API и интеграции</Title>
    <Text type="secondary" style={{ fontSize: 16 }}>Управляйте API ключами и интеграциями с другими сервисами</Text>
    <div style={{ marginTop: 32 }}>
      <div style={{ marginBottom: 16, fontWeight: 500 }}>API ключ</div>
      <Input.Password defaultValue="1234567890abcdef" style={{ width: 320, marginBottom: 20 }} size="large" />
      <Button style={{ marginLeft: 8, marginRight: 8, borderRadius: 8 }}>Показать</Button>
      <Button style={{ borderRadius: 8 }}>Обновить</Button>
      <div style={{ marginTop: 32, marginBottom: 16, fontWeight: 500 }}>Интеграции с CRM-системами</div>
      <Card style={{ marginBottom: 12, borderRadius: 16, background: '#f7faff', border: 'none', boxShadow: '0 2px 12px #e6eaf1' }}>
        <b>Bitrix24</b><br />Синхронизация клиентов и сделок с Bitrix24 <Button style={{ float: 'right', borderRadius: 8 }}>Подключить</Button>
      </Card>
      <Card style={{ marginBottom: 12, borderRadius: 16, background: '#f7faff', border: 'none', boxShadow: '0 2px 12px #e6eaf1' }}>
        <b>amoCRM</b><br />Интеграция с amoCRM для управления сделками <Button style={{ float: 'right', borderRadius: 8 }}>Подключить</Button>
      </Card>
      <Card style={{ marginBottom: 12, borderRadius: 16, background: '#f7faff', border: 'none', boxShadow: '0 2px 12px #e6eaf1' }}>
        <b>Мегаплан</b><br />Синхронизация задач и клиентов с Мегапланом <Button style={{ float: 'right', borderRadius: 8 }}>Подключить</Button>
      </Card>
      <Card style={{ marginBottom: 12, borderRadius: 16, background: '#f7faff', border: 'none', boxShadow: '0 2px 12px #e6eaf1' }}>
        <b>Salesforce</b><br />Интеграция с Salesforce CRM <Button style={{ float: 'right', borderRadius: 8 }}>Подключить</Button>
      </Card>
      <Button type="primary" size="large" style={{ marginTop: 32, borderRadius: 12, fontWeight: 600 }}>Сохранить изменения</Button>
    </div>
  </Card>
);

const tabItems = [
  { key: 'general', label: 'Общие', children: generalTab },
  { key: 'notifications', label: 'Уведомления', children: <NotificationSettingsTab /> },
  { key: 'appearance', label: 'Внешний вид', children: appearanceTab },
  { key: 'api', label: 'API и интеграции', children: apiTab },
];

export default function SettingsPage() {
  const auth = useContext(AuthContext);
  const [user, setUser] = useState(auth?.user || {});
  const [activeTab, setActiveTab] = useState('general');
  return (
    <div className={styles.tabContent}>
      <div style={{
        width: '100%',
        minHeight: '100vh',
        padding: '0',
        background: '#f7f9fb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
      }}>
        <h1 style={{ margin: '0 0 24px 0', textAlign: 'left', fontWeight: 400, fontSize: 32, letterSpacing: 0.5, color: '#222', textShadow: 'none', paddingLeft: 40 }}>
          Настройки
        </h1>
        <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', flex: 1 }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'general', label: 'Общие', children: generalTab(user, setUser, auth?.setAuthData) },
              { key: 'notifications', label: 'Уведомления', children: <NotificationSettingsTab /> },
              { key: 'appearance', label: 'Внешний вид', children: appearanceTab },
              { key: 'api', label: 'API и интеграции', children: apiTab },
            ]}
            style={{ background: 'transparent', width: '100%' }}
            tabBarStyle={{ fontSize: 22, fontWeight: 700, marginBottom: 32, paddingLeft: 24 }}
          />
        </div>
        <style>{`
          @media (max-width: 767px) {
            .settings-form {
              padding: 16px;
            }
            .settings-form .ant-form-item {
              flex-direction: column;
              align-items: flex-start;
            }
            .settings-form .ant-form-item-label {
              text-align: left;
              width: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  );
} 