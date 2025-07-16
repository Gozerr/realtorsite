import React from 'react';
import { Card, Avatar, Typography, Space, Dropdown, Menu, Tag } from 'antd';
import { UserOutlined, EditOutlined, PhoneOutlined, MailOutlined, HomeOutlined } from '@ant-design/icons';
import { Client, ClientStatus } from '../types';

const { Text, Title } = Typography;

interface ClientCardProps {
  client: Client;
}

const statusMap: Record<Client['status'], { text: string; color: string }> = {
  new: { text: 'Новый', color: 'blue' },
  negotiation: { text: 'Переговоры', color: 'orange' },
  contract: { text: 'Контракт', color: 'purple' },
  deposit: { text: 'Задаток', color: 'cyan' },
  success: { text: 'Успех', color: 'green' },
  refused: { text: 'Отказ', color: 'red' },
};

const ClientCard: React.FC<ClientCardProps> = ({ client }) => {

  const menu = (
    <Menu>
      <Menu.Item key="1">Сменить статус</Menu.Item>
    </Menu>
  );
  
  const clientStatus = statusMap[client.status];

  // --- Кнопки для связи через мессенджеры ---
  const renderMessengers = () => {
    const { telegramUsername, whatsappNumber } = client;
    return (
      <>
        {telegramUsername && (
          <a href={`https://t.me/${telegramUsername.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer">
            <img src="/telegram-icon.svg" alt="Telegram" style={{ width: 22, height: 22, marginLeft: 6 }} loading="lazy" />
          </a>
        )}
        {whatsappNumber && (
          <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
            <img src="/whatsapp-icon.svg" alt="WhatsApp" style={{ width: 22, height: 22, marginLeft: 6 }} loading="lazy" />
          </a>
        )}
      </>
    );
  };

  return (
    <Card
      hoverable
      style={{ borderRadius: '16px' }}
      actions={[
        <EditOutlined key="edit" />,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <Avatar size={48} icon={<UserOutlined />} />
          <div data-testid={`client-card-${client.id}`}>
            <Title level={5} style={{ margin: 0 }}>{client.name}</Title>
            <Dropdown overlay={menu} trigger={['click']}>
              <Tag color={clientStatus.color} style={{ cursor: 'pointer', marginTop: '4px' }}>
                {clientStatus.text} ▾
              </Tag>
            </Dropdown>
          </div>
        </Space>

        <Space direction="vertical" style={{ marginTop: 16 }}>
          <Space>
            <PhoneOutlined />
            <Text>{client.phone}</Text>
            {renderMessengers()}
          </Space>
          <Space>
            <MailOutlined />
            <Text>{client.email}</Text>
          </Space>
          <Space>
            <HomeOutlined />
            <Text underline style={{ color: '#1890ff', cursor: 'pointer' }}>3-комнатная квартира, 78 м²</Text> 
          </Space>
        </Space>
      </Space>
    </Card>
  );
};

function areEqual(prevProps: ClientCardProps, nextProps: ClientCardProps) {
  return (
    prevProps.client.id === nextProps.client.id &&
    prevProps.client.updatedAt === nextProps.client.updatedAt
  );
}

export default React.memo(ClientCard, areEqual); 