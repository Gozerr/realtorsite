import React, { useEffect, useState } from 'react';
import { getMyAgencyManagers } from '../../services/agency.service';
import { Card, Row, Col, Avatar, Typography, Spin, Empty, Tag } from 'antd';

const { Title, Text } = Typography;

const AgencyManagersTab: React.FC<{ agency: any }> = () => {
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getMyAgencyManagers()
      .then(setManagers)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Title level={4}>Руководители агентства</Title>
      {loading ? <Spin /> : (
        <Row gutter={[16, 16]}>
          {managers.length > 0 ? managers.map(manager => (
            <Col xs={24} sm={12} md={8} key={manager.id}>
              <Card>
                <Card.Meta
                  avatar={<Avatar src={manager.photo} size={48}>{manager.firstName?.[0]}</Avatar>}
                  title={`${manager.lastName} ${manager.firstName}`}
                  description={<>
                    <Text>{manager.email}</Text><br/>
                    <Text type="secondary">{manager.phone}</Text><br/>
                    <Tag color={manager.status === 'active' ? 'green' : 'orange'}>{manager.status}</Tag>
                  </>}
                />
              </Card>
            </Col>
          )) : (
            <Col span={24}><Empty description="Руководители не найдены." /></Col>
          )}
        </Row>
      )}
    </div>
  );
};

export default AgencyManagersTab; 