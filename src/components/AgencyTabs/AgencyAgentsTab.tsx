import React, { useEffect, useState } from 'react';
import { getMyAgencyAgents, fireAgent, restoreAgent } from '../../services/agency.service';
import { getPropertiesByAgent } from '../../services/property.service';
import { getClientsByAgent } from '../../services/client.service';
import { Card, Row, Col, Typography, Spin, Empty, Tag, Button, Modal, message } from 'antd';
import { useAuth } from '../../context/AuthContext';
import PropertyCard from '../PropertyCard';
import ClientCard from '../ClientCard';

const { Title, Text } = Typography;

const avatarStyle: React.CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: 12,
  objectFit: 'cover',
  background: '#f0f0f0',
  fontSize: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const cardStyle: React.CSSProperties = {
  padding: 6,
  borderRadius: 10,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  marginBottom: 0,
  maxWidth: 320,
  minWidth: 0,
  width: '100%',
};

const metaStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const AgencyAgentsTab: React.FC<{ agency: any }> = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ visible: boolean; agent: any | null }>({ visible: false, agent: null });
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [detailsModal, setDetailsModal] = useState<{ visible: boolean; agent: any | null }>({ visible: false, agent: null });
  const [agentProperties, setAgentProperties] = useState<any[]>([]);
  const [agentClients, setAgentClients] = useState<any[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadAgents = () => {
    setLoading(true);
    getMyAgencyAgents()
      .then(setAgents)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAgents(); }, []);

  const handleFire = async () => {
    if (!modal.agent) return;
    setActionLoading(true);
    try {
      await fireAgent(modal.agent.id, reason);
      message.success('Сотрудник уволен');
      setModal({ visible: false, agent: null });
      setReason('');
      loadAgents();
    } catch {
      message.error('Ошибка при увольнении');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (agent: any) => {
    setActionLoading(true);
    try {
      await restoreAgent(agent.id);
      message.success('Сотрудник восстановлен');
      loadAgents();
    } catch {
      message.error('Ошибка при восстановлении');
    } finally {
      setActionLoading(false);
    }
  };

  const openAgentDetails = async (agent: any) => {
    setDetailsModal({ visible: true, agent });
    setDetailsLoading(true);
    try {
      const [properties, clients] = await Promise.all([
        getPropertiesByAgent(agent.id),
        getClientsByAgent(agent.id),
      ]);
      setAgentProperties(properties);
      setAgentClients(clients);
    } catch {
      setAgentProperties([]);
      setAgentClients([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div>
      <Title level={4}>Агенты агентства</Title>
      {loading ? <Spin /> : (
        <Row gutter={[8, 8]}>
          {agents.length > 0 ? agents.map(agent => (
            <Col xs={24} sm={12} md={8} key={agent.id}>
              <Card
                style={cardStyle}
                actions={[
                  user?.role === 'director' && agent.status !== 'fired' && agent.id !== user.id && (
                    <Button danger size="small" style={{ padding: '0 8px', fontSize: 12, height: 24 }} onClick={() => setModal({ visible: true, agent })}>Уволить</Button>
                  ),
                  user?.role === 'director' && agent.status === 'fired' && (
                    <Button size="small" style={{ padding: '0 8px', fontSize: 12, height: 24 }} onClick={() => handleRestore(agent)}>Восстановить</Button>
                  )
                ].filter(Boolean)}
                bodyStyle={{ padding: 6 }}
                hoverable
                onClick={() => openAgentDetails(agent)}
              >
                <div style={metaStyle}>
                  <img
                    src={agent.photo || undefined}
                    alt={agent.firstName || '?'}
                    style={avatarStyle}
                    onError={e => (e.currentTarget.src = '')}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.2 }}>{agent.lastName} {agent.firstName}</div>
                    <div style={{ fontSize: 12, color: '#555', margin: '2px 0' }}>{agent.email}</div>
                    {agent.phone && <div style={{ fontSize: 12, color: '#888', margin: '2px 0' }}>{agent.phone}</div>}
                    <Tag color={agent.status === 'active' ? 'green' : agent.status === 'fired' ? 'red' : 'orange'} style={{ fontSize: 11, height: 20, lineHeight: '18px', padding: '0 8px' }}>{agent.status === 'fired' ? 'Уволен' : agent.status}</Tag>
                  </div>
                </div>
              </Card>
            </Col>
          )) : (
            <Col span={24}><Empty description="Агенты не найдены." /></Col>
          )}
        </Row>
      )}
      <Modal
        open={modal.visible}
        title={`Уволить сотрудника: ${modal.agent?.lastName || ''} ${modal.agent?.firstName || ''}`}
        onCancel={() => { setModal({ visible: false, agent: null }); setReason(''); }}
        onOk={handleFire}
        confirmLoading={actionLoading}
        okText="Уволить"
        okButtonProps={{ danger: true }}
      >
        <p>Вы уверены, что хотите уволить этого сотрудника? Это действие можно отменить.</p>
        <input
          style={{ width: '100%', marginTop: 8 }}
          placeholder="Причина увольнения (необязательно)"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
      </Modal>
      <Modal
        open={detailsModal.visible}
        title={detailsModal.agent ? `Информация об агенте: ${detailsModal.agent.lastName} ${detailsModal.agent.firstName}` : ''}
        onCancel={() => { setDetailsModal({ visible: false, agent: null }); setAgentProperties([]); setAgentClients([]); }}
        footer={null}
        width={700}
      >
        {detailsLoading ? <Spin /> : detailsModal.agent && (
          <div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 16 }}>
              <img src={detailsModal.agent.photo || undefined} alt={detailsModal.agent.firstName || '?'} style={{ width: 90, height: 90, borderRadius: 16, objectFit: 'cover', background: '#f0f0f0' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 18 }}>{detailsModal.agent.lastName} {detailsModal.agent.firstName}</div>
                <div style={{ fontSize: 14, color: '#555' }}>{detailsModal.agent.email}</div>
                {detailsModal.agent.phone && <div style={{ fontSize: 14, color: '#888' }}>{detailsModal.agent.phone}</div>}
                <Tag color={detailsModal.agent.status === 'active' ? 'green' : detailsModal.agent.status === 'fired' ? 'red' : 'orange'} style={{ fontSize: 12, height: 22, lineHeight: '20px', padding: '0 10px', marginTop: 4 }}>{detailsModal.agent.status === 'fired' ? 'Уволен' : detailsModal.agent.status}</Tag>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Title level={5} style={{ marginBottom: 8 }}>Объекты агента</Title>
              {agentProperties.length === 0 ? <Text type="secondary">Нет объектов</Text> : (
                <Row gutter={[8, 8]}>
                  {agentProperties.map((property: any) => (
                    <Col xs={24} sm={12} key={property.id}>
                      <PropertyCard property={property} mode="compact" />
                    </Col>
                  ))}
                </Row>
              )}
            </div>
            <div>
              <Title level={5} style={{ marginBottom: 8 }}>Клиенты агента</Title>
              {agentClients.length === 0 ? <Text type="secondary">Нет клиентов</Text> : (
                <Row gutter={[8, 8]}>
                  {agentClients.map((client: any) => (
                    <Col xs={24} sm={12} key={client.id}>
                      <ClientCard client={client} />
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AgencyAgentsTab; 