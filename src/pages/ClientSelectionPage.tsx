import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSelectionByClientToken, sendClientLike } from '../services/selection.service';
import { Card, Button, Spin, Typography, Row, Col, message, Empty, Tooltip } from 'antd';
import { LikeOutlined, DislikeOutlined } from '@ant-design/icons';
import OptimizedImage from '../components/OptimizedImage';

const { Title } = Typography;

function getThumbnail(photo: string | undefined): string | undefined {
  if (!photo) return undefined;
  if (photo.startsWith('/uploads/objects/')) {
    const parts = photo.split('/');
    return ['/uploads', 'objects', 'thumbnails', ...parts.slice(3)].join('/');
  }
  return undefined;
}

const ClientSelectionPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<any>(null);
  const [likes, setLikes] = useState<{ [propertyId: number]: boolean | null }>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getSelectionByClientToken(token)
      .then(data => {
        setSelection(data);
        // Инициализируем лайки
        const likeMap: { [propertyId: number]: boolean | null } = {};
        (data.clientLikes || []).forEach((l: any) => { likeMap[l.propertyId] = l.liked; });
        data.properties.forEach((p: any) => {
          if (!(p.id in likeMap)) likeMap[p.id] = null;
        });
        setLikes(likeMap);
        setError(null);
      })
      .catch(() => {
        setError('Подборка не найдена или ссылка недействительна');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleLike = async (propertyId: number, liked: boolean) => {
    if (!token) return;
    setLikes(prev => ({ ...prev, [propertyId]: liked }));
    try {
      await sendClientLike(token, propertyId, liked);
      message.success('Ваш выбор сохранён');
    } catch {
      message.error('Ошибка сохранения выбора');
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;
  if (error) return <Empty description={error} style={{ marginTop: 80 }} />;
  if (!selection) return null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 8px 40px 8px' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>Ваша подборка объектов</Title>
      <Row gutter={[24, 24]}>
        {selection.properties.map((item: any) => (
          <Col xs={24} sm={12} key={item.id}>
            <Card
              style={{ borderRadius: 14, boxShadow: '0 2px 12px #e6eaf1', minHeight: 220, background: '#fff', padding: 0 }}
              bodyStyle={{ padding: 18 }}
            >
              <OptimizedImage
                src={getThumbnail(item.photos && item.photos[0]) || (item.photos && item.photos[0]) || '/placeholder-property.jpg'}
                alt={item.title}
                width="100%"
                height={160}
                style={{ objectFit: 'cover', borderRadius: 10, marginBottom: 12, background: '#f5f5f5' }}
                lazy={true}
                fallback="/placeholder-property.jpg"
              />
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: '#222' }}>{item.title}</div>
              <div style={{ color: '#888', fontSize: 14, marginBottom: 6 }}>{item.address}</div>
              <div style={{ color: '#222', fontSize: 15, marginBottom: 2 }}><b>Цена:</b> {item.price} ₽</div>
              <div style={{ color: '#222', fontSize: 15, marginBottom: 8 }}><b>Площадь:</b> {item.area} м²</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
                <Tooltip title="Понравилось">
                  <Button
                    type={likes[item.id] === true ? 'primary' : 'default'}
                    shape="circle"
                    icon={<LikeOutlined />}
                    onClick={() => handleLike(item.id, true)}
                    style={{ background: likes[item.id] === true ? '#22c55e' : undefined, color: likes[item.id] === true ? '#fff' : undefined, borderColor: likes[item.id] === true ? '#22c55e' : undefined }}
                  />
                </Tooltip>
                <Tooltip title="Не понравилось">
                  <Button
                    type={likes[item.id] === false ? 'primary' : 'default'}
                    shape="circle"
                    icon={<DislikeOutlined />}
                    onClick={() => handleLike(item.id, false)}
                    style={{ background: likes[item.id] === false ? '#f44336' : undefined, color: likes[item.id] === false ? '#fff' : undefined, borderColor: likes[item.id] === false ? '#f44336' : undefined }}
                  />
                </Tooltip>
                {likes[item.id] === true && <span style={{ color: '#22c55e', fontWeight: 500, marginLeft: 8 }}>Понравилось</span>}
                {likes[item.id] === false && <span style={{ color: '#f44336', fontWeight: 500, marginLeft: 8 }}>Не понравилось</span>}
                {likes[item.id] === null && <span style={{ color: '#bbb', fontWeight: 500, marginLeft: 8 }}>Нет выбора</span>}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ClientSelectionPage; 