import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Tag, Table, Typography, Spin, message } from 'antd';
import { HomeOutlined, UserOutlined, StarOutlined } from '@ant-design/icons';
import { getMyAgencyAgents } from '../../services/agency.service';

const { Title } = Typography;

const statusLabels: Record<string, string> = {
  for_sale: 'На продаже',
  in_deal: 'В сделке',
  reserved: 'Зарезервировано',
  sold: 'Продано',
};

// SVG Line Chart
const LineChart: React.FC<{ data: { month: string; value: number }[] }> = ({ data }) => {
  if (!data.length) return <div style={{ color: '#aaa', textAlign: 'center' }}>Нет данных</div>;
  const width = 420, height = 180, padding = 40;
  const max = Math.max(...data.map(d => d.value), 1);
  const points = data.map((d, i) => [
    padding + (i * (width - 2 * padding)) / (data.length - 1),
    height - padding - ((d.value / max) * (height - 2 * padding))
  ]);
  const path = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  return (
    <svg width={width} height={height} style={{ width: '100%', maxWidth: 420 }}>
      {/* Axes */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#bbb" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#bbb" />
      {/* Path */}
      <path d={path} fill="none" stroke="#1890ff" strokeWidth={2.5} />
      {/* Points */}
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4} fill="#1890ff" stroke="#fff" strokeWidth={1.5} />
      ))}
      {/* Labels */}
      {data.map((d, i) => (
        <text key={i} x={points[i][0]} y={height - padding + 18} textAnchor="middle" fontSize={12} fill="#888">{d.month}</text>
      ))}
      {/* Y axis labels */}
      {[0, 0.5, 1].map((t, i) => (
        <text key={i} x={padding - 8} y={height - padding - t * (height - 2 * padding) + 4} textAnchor="end" fontSize={12} fill="#888">{Math.round(max * t)}</text>
      ))}
    </svg>
  );
};

// SVG Bar Chart
const BarChart: React.FC<{ data: { stage: string; value: number }[] }> = ({ data }) => {
  if (!data.length) return <div style={{ color: '#aaa', textAlign: 'center' }}>Нет данных</div>;
  const width = 420, height = 180, padding = 40;
  const max = Math.max(...data.map(d => d.value), 1);
  const barWidth = (width - 2 * padding) / data.length - 12;
  return (
    <svg width={width} height={height} style={{ width: '100%', maxWidth: 420 }}>
      {/* Axes */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#bbb" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#bbb" />
      {/* Bars */}
      {data.map((d, i) => {
        const x = padding + i * ((width - 2 * padding) / data.length) + 6;
        const y = height - padding - (d.value / max) * (height - 2 * padding);
        const h = (d.value / max) * (height - 2 * padding);
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={h} fill="#52c41a" rx={4} />
            <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize={12} fill="#52c41a">{d.value}</text>
            <text x={x + barWidth / 2} y={height - padding + 18} textAnchor="middle" fontSize={12} fill="#888">{d.stage}</text>
          </g>
        );
      })}
      {/* Y axis labels */}
      {[0, 0.5, 1].map((t, i) => (
        <text key={i} x={padding - 8} y={height - padding - t * (height - 2 * padding) + 4} textAnchor="end" fontSize={12} fill="#888">{Math.round(max * t)}</text>
      ))}
    </svg>
  );
};

const AgencyAnalyticsTab: React.FC<{ properties: any[]; clients: any[] }> = ({ properties, clients }) => {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [agentsData] = await Promise.all([
          getMyAgencyAgents(),
        ]);
        setAgents(agentsData);
      } catch {
        message.error('Не удалось загрузить агентов');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Карточки
  const total = properties.length;
  const forSale = properties.filter(p => p.status === 'for_sale').length;
  const sold = properties.filter(p => p.status === 'sold').length;
  const exclusive = properties.filter(p => p.isExclusive).length;
  const agentCount = agents.length;
  const clientCount = clients.length;

  // Динамика по месяцам
  const monthly = properties.reduce((acc: Record<string, number>, p) => {
    const d = new Date(p.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const lineData = Object.entries(monthly).map(([month, value]) => ({ month, value }));
  lineData.sort((a, b) => a.month.localeCompare(b.month));

  // Воронка по статусам
  const funnelData = Object.entries(
    properties.reduce((acc: Record<string, number>, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, value]) => ({ stage: statusLabels[status] || status, value }));

  // Топ-5 агентов по количеству объектов
  const agentStats = agents.map(agent => ({
    ...agent,
    propertyCount: properties.filter(p => p.agent && p.agent.id === agent.id).length,
  }));
  agentStats.sort((a, b) => b.propertyCount - a.propertyCount);
  const topAgents = agentStats.slice(0, 5);

  const agentColumns = [
    { title: 'Агент', dataIndex: 'fullName', key: 'fullName', render: (_: any, r: any) => `${r.lastName || ''} ${r.firstName || ''}` },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Объектов', dataIndex: 'propertyCount', key: 'propertyCount', render: (v: number) => <Tag color="blue">{v}</Tag> },
  ];

  if (loading) return <Spin />;

  return (
    <div>
      <Title level={4}>Аналитика агентства</Title>
      <Row gutter={[16, 16]}>
        <Col span={4}><Card><Statistic title="Всего объектов" value={total} prefix={<HomeOutlined />} /></Card></Col>
        <Col span={4}><Card><Statistic title="На продаже" value={forSale} /></Card></Col>
        <Col span={4}><Card><Statistic title="Продано" value={sold} /></Card></Col>
        <Col span={4}><Card><Statistic title="Эксклюзивы" value={exclusive} prefix={<StarOutlined />} /></Card></Col>
        <Col span={4}><Card><Statistic title="Клиенты" value={clientCount} prefix={<UserOutlined />} /></Card></Col>
        <Col span={4}><Card><Statistic title="Агенты" value={agentCount} prefix={<UserOutlined />} /></Card></Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 32 }}>
        <Col span={12}>
          <Card title="Динамика добавления объектов (по месяцам)">
            <LineChart data={lineData} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Воронка продаж (по статусам)">
            <BarChart data={funnelData} />
          </Card>
        </Col>
      </Row>
      <Row style={{ marginTop: 32 }}>
        <Col span={24}>
          <Card title="Топ-5 агентов по количеству объектов">
            <Table
              rowKey="id"
              columns={agentColumns}
              dataSource={topAgents}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AgencyAnalyticsTab; 