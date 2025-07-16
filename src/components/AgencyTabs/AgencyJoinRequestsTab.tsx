import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Spin, message, Typography } from 'antd';
import { getJoinRequests, approveJoinRequest, rejectJoinRequest } from '../../services/joinRequest.service';
import { useAuth } from '../../context/AuthContext';

const { Title } = Typography;

const AgencyJoinRequestsTab: React.FC<{ agency: any }> = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getJoinRequests();
      setRequests(data);
    } catch (e) {
      message.error('Не удалось загрузить заявки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await approveJoinRequest(id);
      message.success('Заявка одобрена');
      loadRequests();
    } catch {
      message.error('Ошибка при одобрении');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await rejectJoinRequest(id);
      message.success('Заявка отклонена');
      loadRequests();
    } catch {
      message.error('Ошибка при отклонении');
    } finally {
      setActionLoading(null);
    }
  };

  const columns = [
    { title: 'Имя', dataIndex: ['user', 'firstName'], key: 'firstName', render: (_: any, r: any) => `${r.user?.lastName || ''} ${r.user?.firstName || ''}` },
    { title: 'Email', dataIndex: ['user', 'email'], key: 'email' },
    { title: 'Роль', dataIndex: 'role', key: 'role', render: (role: string) => <Tag>{role}</Tag> },
    { title: 'Дата', dataIndex: 'createdAt', key: 'createdAt', render: (d: string) => new Date(d).toLocaleString() },
    { title: 'Статус', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'pending' ? 'orange' : s === 'approved' ? 'green' : 'red'}>{s}</Tag> },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, r: any) => r.status === 'pending' && (
        <span>
          <Button size="small" type="primary" loading={actionLoading === r.id} onClick={() => handleApprove(r.id)} style={{ marginRight: 8 }}>Одобрить</Button>
          <Button size="small" danger loading={actionLoading === r.id} onClick={() => handleReject(r.id)}>Отклонить</Button>
        </span>
      )
    }
  ];

  const filteredRequests = user ? requests.filter(r => r.user?.id !== user.id) : requests;

  return (
    <div>
      <Title level={4}>Заявки на вступление</Title>
      {loading ? <Spin /> : (
        <Table rowKey="id" columns={columns} dataSource={filteredRequests} pagination={false} />
      )}
    </div>
  );
};

export default AgencyJoinRequestsTab; 