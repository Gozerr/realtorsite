import React, { useContext, useEffect, useState, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ChatWidget } from '../components/ChatWidget';
import { List, Avatar, Input, Spin, Alert, Badge, Typography, Tag } from 'antd';
import { MessageOutlined, HomeOutlined, PropertySafetyOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const { Title } = Typography;

// Функция для нормализации массива фото объекта
function normalizePhotos(photos: any): string[] {
  if (Array.isArray(photos)) return photos;
  if (typeof photos === 'string') {
    try {
      const arr = JSON.parse(photos);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  return [];
}

const MyChatsPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const BACKEND_HOST = window.location.hostname;
  const API_URL = `http://${BACKEND_HOST}:3001/api`;

  useEffect(() => {
    if (!auth?.token) return;
    setLoading(true);
    fetch(`${API_URL}/chats`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then(res => res.json())
      .then(data => {
        setChats(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch(() => {
        setChats([]);
        setError('Ошибка загрузки чатов');
      })
      .finally(() => setLoading(false));
  }, [auth?.token]);

  // Открытие чата по параметрам (propertyId, agentId)
  useEffect(() => {
    if (!auth || !auth.token) return;
    const params = new URLSearchParams(location.search);
    const propertyId = params.get('propertyId');
    const agentId = params.get('agentId');
    if (propertyId && agentId && chats.length > 0) {
      const found = chats.find(chat =>
        String(chat.property?.id) === String(propertyId) &&
        String(chat.seller?.id) === String(agentId)
      );
      if (found) {
        setSelectedChat(found);
        navigate('/my-chats', { replace: true });
      }
    }
  }, [location.search, chats, auth, navigate]);

  const filteredChats = useMemo(() => chats.filter(chat => {
    const query = search.toLowerCase();
    return (
      chat.property?.title?.toLowerCase().includes(query) ||
      chat.property?.address?.toLowerCase().includes(query) ||
      chat.seller?.firstName?.toLowerCase().includes(query) ||
      chat.buyer?.firstName?.toLowerCase().includes(query)
    );
  }), [chats, search]);

  const sortedChats = useMemo(() => {
    const byTime = (a: any, b: any) => {
      const aTime = new Date(a.lastMessage?.createdAt || a.createdAt).getTime();
      const bTime = new Date(b.lastMessage?.createdAt || b.createdAt).getTime();
      return bTime - aTime;
    };
    const unread = filteredChats.filter((c: any) => (c.unreadCount ?? 0) > 0).sort(byTime);
    const read = filteredChats.filter((c: any) => !(c.unreadCount ?? 0)).sort(byTime);
    return [...unread, ...read];
  }, [filteredChats]);

  if (!auth?.user) return <div>Требуется авторизация</div>;

  // Debug-вывод параметров выбранного чата
  if (selectedChat && auth?.user && auth.token) {
    console.log('[MyChatsPage] ChatWidget params:', {
      chatId: selectedChat.id,
      userId: auth.user.id,
      jwt: auth.token,
      propertyId: selectedChat.property?.id,
      sellerId: selectedChat.seller?.id,
      buyerId: selectedChat.buyer?.id,
    });
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 40px)', background: '#f8fafc', minHeight: 600 }}>
      {/* Список чатов */}
      <div style={{ width: 370, background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px #e6eaf1', margin: '32px 0 32px 32px', padding: 0, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: '28px 28px 12px 28px', borderBottom: '1px solid #f0f0f0' }}>
          <Title level={2} style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>Чаты</Title>
          <Input.Search
            placeholder="Поиск чатов..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginTop: 18, borderRadius: 8, fontSize: 16, padding: '10px 16px' }}
            allowClear
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 12px 0' }}>
          <Spin spinning={loading}>
            {error && <Alert type="error" message={error} style={{ margin: 12 }} />}
            {!loading && sortedChats.length === 0 && !error && (
              <Alert type="info" message="У вас пока нет чатов" style={{ margin: 12 }} />
            )}
            <List
              itemLayout="horizontal"
              dataSource={sortedChats}
              style={{ border: 'none', background: 'transparent', padding: 0 }}
              renderItem={chat => {
                // Миниатюра объекта недвижимости (универсальная обработка)
                const images = normalizePhotos(chat.property?.photos);
                let propertyPhoto = images[0];
                if (propertyPhoto) {
                  if (propertyPhoto.startsWith('/uploads/objects/')) {
                    propertyPhoto = propertyPhoto.replace('/uploads/objects/', '/uploads/objects/thumbnails/');
                  } else {
                    propertyPhoto = `/uploads/objects/thumbnails/${propertyPhoto}`;
                  }
                } else {
                  propertyPhoto = '/placeholder-property.jpg';
                }
                return (
                  <List.Item
                    key={chat.id}
                    style={{ cursor: 'pointer', padding: '16px 10px', borderBottom: '1px solid #f0f0f0', background: selectedChat?.id === chat.id ? '#f5f7fa' : undefined, transition: 'background 0.2s', minHeight: 56, borderRadius: 10, marginBottom: 0 }}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar size={38} src={propertyPhoto} style={{ background: '#e6eaf1', border: '2px solid #fff', objectFit: 'cover' }} />
                      }
                      title={
                        <div style={{ fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                          {chat.property?.title || 'Без названия'}
                        </div>
                      }
                      description={
                        <div style={{ fontSize: 14, color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                          {chat.property?.address || ''}
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </Spin>
        </div>
      </div>
      {/* Окно чата */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', margin: '32px 32px 32px 0', background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px #e6eaf1', overflow: 'hidden', minHeight: 0 }}>
        {selectedChat ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Шапка чата */}
            <div style={{
              background: '#f9fafb',
              borderRadius: '18px 18px 0 0',
              minHeight: 56,
              padding: '18px 32px 10px 32px',
              borderBottom: '1.5px solid #e6eaf1',
              marginBottom: 0,
              boxShadow: '0 2px 8px #e6eaf1',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Миниатюра аватара продавца (seller) */}
                  {(() => {
                    let sellerAvatar = selectedChat.seller?.photo || selectedChat.seller?.avatar || undefined;
                    // Не подставлять /avatars/ и не заменять на /thumbnails/ — использовать путь как есть
                    return (
                      <Avatar size={34} src={sellerAvatar} style={{ background: '#f2f3f5', fontWeight: 700, flexShrink: 0, objectFit: 'cover' }}>
                        {(!sellerAvatar && selectedChat.seller?.firstName) ? selectedChat.seller.firstName[0] : 'A'}
                      </Avatar>
                    );
                  })()}
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#222' }}>{selectedChat.seller?.lastName} {selectedChat.seller?.firstName}</span>
                </div>
                {/* Статус объекта */}
                {selectedChat.property?.status && (
                  <Tag color={
                    selectedChat.property.status === 'for_sale' ? 'green' :
                    selectedChat.property.status === 'in_deal' ? 'orange' :
                    selectedChat.property.status === 'reserved' ? 'blue' :
                    selectedChat.property.status === 'sold' ? 'red' : 'default'
                  } style={{ fontWeight: 600, fontSize: 15, padding: '2px 16px', borderRadius: 8, margin: '0 auto' }}>
                    {selectedChat.property.status === 'for_sale' ? 'В продаже' :
                     selectedChat.property.status === 'in_deal' ? 'На задатке' :
                     selectedChat.property.status === 'reserved' ? 'На брони' :
                     selectedChat.property.status === 'sold' ? 'Продан' : selectedChat.property.status}
                  </Tag>
                )}
                <div style={{ fontWeight: 600, fontSize: 16, color: '#2563eb', maxWidth: 340, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <a
                    href={selectedChat.property?.id ? `/properties/${selectedChat.property.id}` : '#'}
                    style={{ color: '#2563eb', fontWeight: 700, fontSize: 16, textDecoration: 'none', transition: 'color 0.2s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    onClick={e => {
                      if (!selectedChat.property?.id) e.preventDefault();
                    }}
                  >
                    {selectedChat.property?.title}
                  </a>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 2 }}>
                <div style={{ color: '#2563eb', fontSize: 15, fontWeight: 500 }}>
                  {selectedChat.seller?.phone && (
                    <a href={`tel:${selectedChat.seller.phone}`} style={{ color: '#2563eb', fontSize: 15, textDecoration: 'none', fontWeight: 500 }} title="Позвонить">
                      {selectedChat.seller.phone}
                    </a>
                  )}
                </div>
                {/* Юридическая чистота */}
                {selectedChat.property?.legalCheck && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f4f6fa', borderRadius: 8, padding: '2px 12px', fontSize: 14, fontWeight: 600, color: selectedChat.property.legalCheck.status === 'Проверено' ? '#52c41a' : '#faad14' }}>
                    <PropertySafetyOutlined style={{ fontSize: 18, color: selectedChat.property.legalCheck.status === 'Проверено' ? '#52c41a' : '#faad14' }} />
                    <span>{selectedChat.property.legalCheck.status}</span>
                  </div>
                )}
                <div style={{ color: '#6b7280', fontSize: 15, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 340 }}>
                  {selectedChat.property?.address}
                </div>
              </div>
            </div>
            {/* ChatWidget с debug-выводом */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              {auth.user && auth.token && (
                <ChatWidget
                  chatId={selectedChat.id}
                  userId={auth.user.id}
                  jwt={auth.token}
                  propertyId={selectedChat.property?.id}
                  sellerId={selectedChat.seller?.id}
                  buyerId={selectedChat.buyer?.id}
                />
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#bbb', marginTop: 120 }}>
            <MessageOutlined style={{ fontSize: 64, marginBottom: 24 }} />
            <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>Выберите чат слева, чтобы начать общение</div>
            <div style={{ fontSize: 16 }}>Здесь появится история переписки и форма для отправки сообщений</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyChatsPage; 