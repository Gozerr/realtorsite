import React, { useEffect, useState } from 'react';
import { getAgencyClients } from '../../services/client.service';
import { Client } from '../../types';
import { Row, Col, Card, Spin, Empty, Typography } from 'antd';
import ClientCard from '../ClientCard';

const { Title } = Typography;

const AgencyClientsTab: React.FC<{ agency: any }> = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAgencyClients()
      .then(setClients)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Title level={4}>Клиенты агентства</Title>
      {loading ? <Spin /> : (
        <Row gutter={[16, 16]}>
          {clients.length > 0 ? clients.map(client => (
            <Col xs={24} sm={12} md={8} key={client.id}>
              <ClientCard client={client} />
            </Col>
          )) : (
            <Col span={24}><Empty description="Клиенты не найдены." /></Col>
          )}
        </Row>
      )}
    </div>
  );
};

export default AgencyClientsTab; 