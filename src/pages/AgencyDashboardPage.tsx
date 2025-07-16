import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Typography, Tabs, Card, Row, Col, Statistic, Button, Divider } from 'antd';
import { TeamOutlined, UserOutlined, HomeOutlined, BellOutlined, CalendarOutlined, SettingOutlined, ApiOutlined, BookOutlined } from '@ant-design/icons';
import { getAllProperties } from '../services/property.service';
import { getClients } from '../services/client.service';
import { getMyAgency } from '../services/agency.service';
import { Property, Client } from '../types';
import AgencyAnalyticsTab from '../components/AgencyTabs/AgencyAnalyticsTab';
import AgencyAgentsTab from '../components/AgencyTabs/AgencyAgentsTab';
import AgencyManagersTab from '../components/AgencyTabs/AgencyManagersTab';
import AgencyPropertiesTab from '../components/AgencyTabs/AgencyPropertiesTab';
import AgencyClientsTab from '../components/AgencyTabs/AgencyClientsTab';
import AgencySettingsTab from '../components/AgencyTabs/AgencySettingsTab';
import AgencyJoinRequestsTab from '../components/AgencyTabs/AgencyJoinRequestsTab';
// Импортировать остальные сервисы по мере необходимости

const { Title } = Typography;

const AgencyDashboardPage = () => {
  const authContext = useContext(AuthContext);
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [agency, setAgency] = useState<any | null>(null);
  const [loadingAgency, setLoadingAgency] = useState(false);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('agencyDashboardTab') || 'analytics');
  // TODO: добавить состояния для агентов, руководителей, уведомлений, календаря, обучения, интеграций

  useEffect(() => {
    // Загрузка объектов агентства
    getAllProperties().then(setProperties);
    // Загрузка клиентов агентства
    if (authContext?.token) {
      getClients().then(setClients);
    }
    // Загрузка агентства
    setLoadingAgency(true);
    if (authContext?.user?.role === 'support' || !authContext?.user?.agencyId) {
      setAgency(null);
      setLoadingAgency(false);
    } else {
      getMyAgency(authContext?.user)
        .then(setAgency)
        .catch(() => setAgency(null))
        .finally(() => setLoadingAgency(false));
    }
    // TODO: загрузить агентов, руководителей, уведомления, календарь, обучение, интеграции
  }, [authContext?.token, authContext?.user]);

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Моё агентство</Title>
      {loadingAgency ? (
        <div style={{ margin: '32px 0' }}>Загрузка агентства...</div>
      ) : agency ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          marginBottom: 32,
          background: '#f6faff',
          borderRadius: 16,
          padding: '24px 32px',
          boxShadow: '0 2px 8px rgba(40,60,90,0.06)',
        }}>
          {agency.logo && (
            <img
              src={agency.logo}
              alt="Логотип агентства"
              style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12, background: '#fff', border: '1px solid #e6eaf1' }}
            />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: '#1e3a5f' }}>{agency.name}</span>
              <span style={{ background: '#52c41a', color: '#fff', borderRadius: 8, padding: '2px 12px', fontSize: 14, fontWeight: 600, marginLeft: 8 }}>Ваше агентство</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ margin: '32px 0', color: '#ff4d4f' }}>Агентство не найдено или не привязано к вашему профилю.</div>
      )}
      <Tabs
        activeKey={activeTab}
        onChange={key => {
          setActiveTab(key);
          localStorage.setItem('agencyDashboardTab', key);
        }}
      >
        <Tabs.TabPane tab={<><TeamOutlined /> Аналитика</>} key="analytics">
          <AgencyAnalyticsTab properties={properties} clients={clients} />
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><TeamOutlined /> Агенты</>} key="agents">
          <AgencyAgentsTab agency={agency} />
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><UserOutlined /> Руководители</>} key="managers">
          <AgencyManagersTab agency={agency} />
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><HomeOutlined /> Объекты</>} key="properties">
          <AgencyPropertiesTab agency={agency} />
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><UserOutlined /> Клиенты</>} key="clients">
          <AgencyClientsTab agency={agency} />
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><TeamOutlined /> Заявки на вступление</>} key="join-requests">
          <AgencyJoinRequestsTab agency={agency} />
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><SettingOutlined /> Настройки</>} key="settings">
          <AgencySettingsTab agency={agency} />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default AgencyDashboardPage; 