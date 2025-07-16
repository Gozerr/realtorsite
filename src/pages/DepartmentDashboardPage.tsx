import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Typography, Tabs, Card, Row, Col, Statistic } from 'antd';
import { TeamOutlined, UserOutlined, HomeOutlined, BellOutlined, CalendarOutlined, SettingOutlined, BookOutlined } from '@ant-design/icons';
import { getAllProperties } from '../services/property.service';
import { getClients } from '../services/client.service';
import { Property, Client } from '../types';
// Импортировать остальные сервисы по мере необходимости

const { Title } = Typography;

const DepartmentDashboardPage = () => {
  const authContext = useContext(AuthContext);
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  // TODO: добавить состояния для агентов группы, уведомлений, календаря, обучения

  useEffect(() => {
    // Загрузка объектов группы
    getAllProperties().then(setProperties);
    // Загрузка клиентов группы
    if (authContext?.token) {
      getClients().then(setClients);
    }
    // TODO: загрузить агентов группы, уведомления, календарь, обучение
  }, [authContext?.token]);

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Мой отдел</Title>
      <Tabs defaultActiveKey="analytics">
        <Tabs.TabPane tab={<><TeamOutlined /> Аналитика</>} key="analytics">
          <Row gutter={16}>
            <Col span={6}><Card><Statistic title="Объекты" value={properties.length} prefix={<HomeOutlined />} /></Card></Col>
            <Col span={6}><Card><Statistic title="Клиенты" value={clients.length} prefix={<UserOutlined />} /></Card></Col>
            {/* TODO: добавить статистику по эффективности агентов группы */}
          </Row>
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><TeamOutlined /> Агенты группы</>} key="agents">
          {/* TODO: управление агентами группы (список, добавление, редактирование, удаление, назначение задач) */}
          <div>Управление агентами группы (в разработке)</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><HomeOutlined /> Объекты</>} key="properties">
          {/* TODO: список объектов с фильтрами */}
          <div>Список объектов (в разработке)</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><UserOutlined /> Клиенты</>} key="clients">
          {/* TODO: список клиентов с фильтрами */}
          <div>Список клиентов (в разработке)</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><BellOutlined /> Уведомления</>} key="notifications">
          {/* TODO: уведомления группы */}
          <div>Уведомления группы (в разработке)</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><CalendarOutlined /> Календарь</>} key="calendar">
          {/* TODO: календарь событий группы */}
          <div>Календарь событий (в разработке)</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><BookOutlined /> Обучение</>} key="education">
          {/* TODO: обучение и развитие группы */}
          <div>Обучение и развитие группы (в разработке)</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><SettingOutlined /> Настройки профиля</>} key="settings">
          {/* TODO: настройки профиля руководителя/группы */}
          <div>Настройки профиля (в разработке)</div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default DepartmentDashboardPage; 