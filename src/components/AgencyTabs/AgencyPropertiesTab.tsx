import React, { useEffect, useState } from 'react';
import { Table, Tag, Spin, Image, Typography, message } from 'antd';
import { getMyAgencyProperties } from '../../services/agency.service';

const { Title } = Typography;

const AgencyPropertiesTab: React.FC<{ agency?: any }> = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const data = await getMyAgencyProperties();
      setProperties(data);
    } catch {
      message.error('Не удалось загрузить объекты агентства');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProperties(); }, []);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Название', dataIndex: 'title', key: 'title' },
    { title: 'Адрес', dataIndex: 'address', key: 'address' },
    { title: 'Цена', dataIndex: 'price', key: 'price', render: (p: number) => p ? p.toLocaleString() + ' ₽' : '-' },
    { title: 'Статус', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'for_sale' ? 'green' : s === 'sold' ? 'red' : 'orange'}>{s}</Tag> },
    { title: 'Агент', dataIndex: ['agent', 'firstName'], key: 'agent', render: (_: any, r: any) => r.agent ? `${r.agent.lastName || ''} ${r.agent.firstName || ''}` : '-' },
    { title: 'Фото', dataIndex: 'photos', key: 'photos', render: (photos: string[]) => photos && photos.length > 0 ? <Image src={photos[0]} width={60} /> : <span style={{ color: '#aaa' }}>Нет</span> },
  ];

  return (
    <div>
      <Title level={4}>Объекты агентства</Title>
      {loading ? <Spin /> : (
        <Table rowKey="id" columns={columns} dataSource={properties} pagination={{ pageSize: 10 }} />
      )}
    </div>
  );
};

export default AgencyPropertiesTab; 