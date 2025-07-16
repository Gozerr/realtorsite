import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Typography, Input, Button, Space, Segmented, Spin, Alert, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';
import { getClients, createClient, getAgencyClients } from '../services/client.service';
import { Client, ClientStatus, CreateClientData } from '../types';
import ClientCard from '../components/ClientCard';
// import CreateClientForm from '../components/CreateClientForm'; // Мы создадим эту форму позже

const { Title, Text } = Typography;
const { Search } = Input;

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filter, setFilter] = useState<string | number>('Активные');
  const [searchTerm, setSearchTerm] = useState('');
  const authContext = useContext(AuthContext);

  const loadClients = async () => {
    setLoading(true);
    setError('');
    try {
      let data: Client[] = [];
      if (authContext?.user?.role === 'director') {
        data = await getAgencyClients();
      } else {
        data = await getClients();
      }
      setClients(data);
    } catch (err) {
      setError('Не удалось загрузить клиентов.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [authContext?.token]);

  // const handleCreateClient = async (clientData: CreateClientData) => {
  //   if (!authContext?.token) return;
  //   setLoading(true);
  //   try {
  //     await createClient(clientData, authContext.token);
  //     fetchClients();
  //     setIsModalVisible(false);
  //   } catch (err) {
  //     setError('Не удалось создать клиента.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const activeStatuses = ['new', 'negotiation', 'contract', 'deposit'];
  
  const filteredClients = clients
    .filter(client => {
      if (filter === 'Активные') return activeStatuses.includes(client.status);
      if (filter === 'Удачные сделки') return client.status === 'success';
      if (filter === 'Отказались') return client.status === 'refused';
      return true;
    })
    .filter(client => client.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={2} style={{ margin: 0 }}>{authContext?.user?.role === 'director' ? 'Клиенты агентства' : 'Мои клиенты'}</Title>
        </Col>
        <Col>
          <Button data-testid="client-add-btn" type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
            Добавить клиента
          </Button>
        </Col>
      </Row>

      <Search
        placeholder="Поиск клиентов..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        allowClear
        autoFocus
      />

      <Segmented
        options={['Активные', 'Удачные сделки', 'Отказались']}
        value={filter}
        onChange={setFilter}
        block
      />

      {loading ? (
        <Spin size="large" />
      ) : error ? (
        <Alert message={error} type="error" showIcon />
      ) : (
        <>
          <Title level={4}>{filter}</Title>
          <Row gutter={[16, 16]} className="staggered-list">
            {filteredClients.length > 0 ? (
              filteredClients.map(client => (
                <Col xs={24} sm={12} md={8} key={client.id}>
                  <ClientCard client={client} />
                </Col>
              ))
            ) : (
              <Col span={24}>
                <Empty description="Клиенты не найдены." style={{ marginTop: 60 }} />
              </Col>
            )}
          </Row>
        </>
      )}

      {/* <Modal
        title="Добавить нового клиента"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <CreateClientForm
          onSubmit={handleCreateClient}
          onCancel={() => setIsModalVisible(false)}
          loading={loading}
        />
      </Modal> */}

      <style>{`
        @media (max-width: 767px) {
          .clients-filters {
            flex-direction: column !important;
            gap: 8px !important;
            padding: 12px !important;
          }
          .client-card-col {
            flex: 0 0 100% !important;
            max-width: 100% !important;
          }
          .ant-btn {
            font-size: 18px !important;
            height: 48px !important;
          }
        }
        @media (max-width: 991px) and (min-width: 768px) {
          .client-card-col {
            flex: 0 0 50% !important;
            max-width: 50% !important;
          }
        }
      `}</style>
    </Space>
  );
};

export default ClientsPage; 