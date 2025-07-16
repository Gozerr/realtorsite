import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Spin, Alert, Row, Col, Card, Tag, Avatar, Button, Typography, Divider } from 'antd';
import { AuthContext } from '../context/AuthContext';
import { useClientMode } from '../context/ClientModeContext';
import { getPropertyById } from '../services/property.service';
import { ChatWidget } from '../components/ChatWidget';
import PropertySingleMapYandex from '../components/PropertySingleMapYandex';
import { PropertySafetyOutlined } from '@ant-design/icons';

const { Title } = Typography;

const statusOptions = [
  { value: 'for_sale', label: 'В продаже', color: 'green' },
  { value: 'in_deal', label: 'На задатке', color: 'orange' },
  { value: 'reserved', label: 'На брони', color: 'blue' },
  { value: 'sold', label: 'Продан', color: 'red' },
];

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

const PropertyDetailsPageClean: React.FC = () => {
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const authContext = useContext(AuthContext);
  const { isClientMode } = useClientMode();
  const [galleryImageIndex, setGalleryImageIndex] = useState(0);

  useEffect(() => {
    setLoading(true);
    getPropertyById(id as string)
      .then((data) => {
        setProperty(data);
      })
      .catch(() => setProperty(null))
      .finally(() => setLoading(false));
  }, [id, authContext?.token]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;
  if (!property) return <Alert message="Объект не найден" type="error" style={{ margin: 40 }} />;

  const images = normalizePhotos(property.photos) || property.images || [];
  const statusObj = statusOptions.find(opt => opt.value === property?.status) || statusOptions[0];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 0', boxSizing: 'border-box', background: '#fff' }}>
      <Row gutter={[40, 32]} align="top">
        <Col xs={24} md={14} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Галерея фото */}
          <section style={{ width: '100%', maxWidth: 900, margin: '0 auto', marginTop: 0 }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', minHeight: 480, background: '#fff', borderRadius: 22, boxShadow: '0 8px 32px #e6eaf1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {images && images.length > 0 && (
                <>
                  <img
                    src={images[galleryImageIndex] || '/placeholder-property.jpg'}
                    alt={property.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 22, transition: 'filter 0.2s' }}
                  />
                  {/* Кнопки навигации */}
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setGalleryImageIndex((galleryImageIndex - 1 + images.length) % images.length)} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 48, height: 48, color: '#fff', fontSize: 28, cursor: 'pointer', zIndex: 2, boxShadow: '0 4px 16px #0006', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>‹</button>
                      <button onClick={() => setGalleryImageIndex((galleryImageIndex + 1) % images.length)} style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 48, height: 48, color: '#fff', fontSize: 28, cursor: 'pointer', zIndex: 2, boxShadow: '0 4px 16px #0006', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>›</button>
                    </>
                  )}
                  {/* Счётчик фото */}
                  <div style={{ position: 'absolute', top: 18, right: 28, background: 'rgba(0,0,0,0.65)', color: '#fff', borderRadius: 10, padding: '3px 14px', fontSize: 16, fontWeight: 600 }}>{galleryImageIndex + 1} / {images.length}</div>
                </>
              )}
            </div>
            {/* Миниатюры под фото с горизонтальным скроллом */}
            {images && images.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '16px 0 0 0', overflowX: 'auto', whiteSpace: 'nowrap', padding: '4px 0', scrollbarWidth: 'thin', msOverflowStyle: 'none' }}>
                {images.map((img, idx) => (
                  <img
                    key={img + idx}
                    src={img}
                    alt={`Фото ${idx + 1}`}
                    style={{
                      width: 80,
                      height: 60,
                      objectFit: 'cover',
                      borderRadius: 10,
                      border: idx === galleryImageIndex ? '3px solid #2563eb' : '2px solid #fff',
                      boxShadow: idx === galleryImageIndex ? '0 0 12px #2563eb55' : '0 2px 8px #0002',
                      cursor: 'pointer',
                      opacity: idx === galleryImageIndex ? 1 : 0.7,
                      transition: 'all 0.2s',
                      marginRight: 0,
                      display: 'inline-block',
                    }}
                    onClick={() => setGalleryImageIndex(idx)}
                  />
                ))}
              </div>
            )}
          </section>
          {/* Современный белый контейнер: всё внутри */}
          <div style={{ background: '#fff', borderRadius: 22, boxShadow: '0 8px 32px #e6eaf1', padding: '32px 36px', marginTop: 32, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
            <div style={{ fontWeight: 800, fontSize: 32, marginBottom: 6 }}>{property.title}</div>
            <div style={{ color: '#888', fontSize: 20, marginBottom: 14 }}>{property.address}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
              <Tag color={statusObj.color} style={{ fontWeight: 600, fontSize: 16, padding: '4px 18px', borderRadius: 8 }}>{statusObj.label}</Tag>
              <Tag color="purple" style={{ fontWeight: 600, fontSize: 16, borderRadius: 8 }}>Эксклюзивный объект</Tag>
              <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary-color)', marginLeft: 18 }}>
                {property.price ? Number(property.price).toLocaleString('ru-RU') + ' руб' : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 36, marginBottom: 22, fontSize: 18 }}>
              <div><b>Площадь:</b> {property.area ?? '—'} м²</div>
              <div><b>Спальни:</b> {property.bedrooms ?? '—'}</div>
              <div><b>Ванные:</b> {property.bathrooms ?? '—'}</div>
              <div><b>Тип:</b> {property.type || '—'}</div>
              <div><b>Этаж:</b> {property.floor ?? '—'} из {property.totalFloors ?? '—'}</div>
              <div><b>Цена за м²:</b> {property.price && property.area ? `${Math.round(property.price / property.area).toLocaleString()} ₽` : '—'}</div>
            </div>
            <div style={{ fontSize: 19, color: '#444', marginBottom: 10, fontWeight: 700 }}>Описание</div>
            <div style={{ fontSize: 17, color: '#555', marginBottom: 0 }}>{property.description || 'Описание отсутствует'}</div>
            {/* Юридическая чистота — современный блок с щитом и статусом */}
            {(() => {
              const legalStatus = property?.legalCheck?.status || 'Не проверен';
              const agencyName = property?.agent?.agency?.name || 'агентством';
              let color = '#faad14';
              let bg = 'linear-gradient(90deg, #fffbe6 60%, #fff 100%)';
              let border = '2px solid #faad14';
              let icon = <PropertySafetyOutlined style={{ fontSize: 48, color: '#faad14', filter: 'drop-shadow(0 2px 8px #faad1444)' }} />;
              let title = 'Объект не прошёл юридическую проверку';
              let subtitle = 'Покупка без проверки — риск. Мы рекомендуем запросить проверку у юриста.';
              let agencyLine = `Не проверен агентством «${agencyName}»`;
              if (legalStatus === 'Проверено') {
                color = '#22c55e';
                bg = 'linear-gradient(90deg, #eafff3 60%, #fff 100%)';
                border = '2px solid #22c55e';
                icon = <PropertySafetyOutlined style={{ fontSize: 48, color: '#22c55e', filter: 'drop-shadow(0 2px 8px #22c55e44)' }} />;
                title = 'Объект прошёл юридическую проверку';
                subtitle = 'Вы защищены: объект проверен юристом, риски минимальны.';
                agencyLine = `Проверен агентством «${agencyName}»`;
              } else if (legalStatus === 'На проверке') {
                color = '#2563eb';
                bg = 'linear-gradient(90deg, #e6f0ff 60%, #fff 100%)';
                border = '2px solid #2563eb';
                icon = <PropertySafetyOutlined style={{ fontSize: 48, color: '#2563eb', filter: 'drop-shadow(0 2px 8px #2563eb44)' }} spin />;
                title = 'Объект проходит юридическую проверку';
                subtitle = 'Юрист проверяет объект. Скоро статус обновится.';
                agencyLine = `Проверяется агентством «${agencyName}»`;
              }
              return (
                <div style={{
                  margin: '36px auto',
                  padding: '32px 36px',
                  background: bg,
                  border,
                  borderRadius: 20,
                  boxShadow: '0 4px 24px #e6eaf1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 32,
                  maxWidth: 700,
                  minHeight: 120,
                  position: 'relative',
                }}>
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 70, height: 70, background: '#fff', borderRadius: '50%', border: `2px solid ${color}`, boxShadow: '0 2px 12px #e6eaf1' }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 24, color, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                      {title}
                    </div>
                    <div style={{ color: color, fontWeight: 600, fontSize: 16, marginBottom: 6 }}>{agencyLine}</div>
                    <div style={{ color: '#555', fontSize: 17, marginBottom: 6 }}>{subtitle}</div>
                    <div style={{ color: '#2563eb', fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
                      <PropertySafetyOutlined style={{ fontSize: 20, color: color, marginRight: 6, verticalAlign: 'middle' }} />
                      Мы защищаем вас от небезопасных объектов
                    </div>
                    {property?.legalCheck?.details && (
                      <div style={{ color: '#555', fontSize: 16, marginTop: 6 }}>{property.legalCheck.details}</div>
                    )}
                    {property?.legalCheck?.date && (
                      <div style={{ color: '#888', fontSize: 15, marginTop: 4 }}>Проверено: {property.legalCheck.date}</div>
                    )}
                  </div>
                </div>
              );
            })()}
            <Divider style={{ margin: '32px 0 18px 0' }} />
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Расположение объекта</div>
            <div style={{ color: '#888', fontSize: 16, marginBottom: 10 }}>{property.address}</div>
            {typeof property.lat === 'number' && typeof property.lng === 'number' && !isNaN(property.lat) && !isNaN(property.lng) ? (
              <div style={{ width: '100%', aspectRatio: '4 / 3', minHeight: 400, borderRadius: 22, boxShadow: '0 8px 32px #e6eaf1', margin: '0 0 28px 0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PropertySingleMapYandex lat={property.lat} lng={property.lng} address={property.address} style={{ width: '100%', height: '100%' }} />
              </div>
            ) : null}
          </div>
        </Col>
        <Col xs={24} md={10} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Агент */}
          {!isClientMode && property.agent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#f8fafc', borderRadius: 16, boxShadow: '0 2px 8px #e6eaf1', padding: '18px 24px', marginBottom: 18 }}>
              {property.agent.photo ? (
                <Avatar size={48} src={property.agent.photo} style={{ background: '#f2f3f5', fontWeight: 700 }} />
              ) : (
                <Avatar size={48} style={{ background: '#f2f3f5', fontWeight: 700 }}>
                  {property.agent.firstName ? property.agent.firstName[0] : 'A'}
                </Avatar>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: '#222' }}>
                  {property.agent.lastName} {property.agent.firstName}
                </div>
                <div style={{ color: '#888', fontSize: 15, margin: '2px 0 4px 0' }}>
                  {property.agent.agency?.name || 'Частный агент'}
                </div>
                <div style={{ color: '#2563eb', fontSize: 16, fontWeight: 600 }}>
                  {property.agent.phone || 'Телефон не указан'}
                </div>
              </div>
            </div>
          )}
          {/* Чат */}
          {!isClientMode && (
            <Card style={{ borderRadius: 22, marginBottom: 28, boxShadow: '0 8px 32px 0 rgba(40,60,90,0.13)', background: 'linear-gradient(120deg, #f8fafc 60%, #e0e7ef 100%)', border: 'none', backdropFilter: 'blur(6px)', padding: 0, overflow: 'visible', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, padding: '18px 24px 0 24px' }}>
                <span style={{ fontSize: 28, color: '#2563eb', background: '#e0e7ef', borderRadius: '50%', padding: 6, marginRight: 6, boxShadow: '0 2px 8px #e6eaf1' }}>💬</span>
                <Title level={4} style={{ margin: 0, color: '#222', fontWeight: 800, fontSize: 22, letterSpacing: -1 }}>Чат по объекту</Title>
                <div style={{ flex: 1 }} />
                <Avatar size={32} src={property.agent?.photo} style={{ background: '#f2f3f5', fontWeight: 700, marginRight: 2 }}>{property.agent?.firstName ? property.agent.firstName[0] : 'A'}</Avatar>
                <span style={{ fontWeight: 600, fontSize: 15, color: '#222' }}>{property.agent?.firstName}</span>
              </div>
              <div style={{ color: '#555', margin: '0 24px 16px 24px', fontSize: 15, background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '8px 14px', fontWeight: 500, boxShadow: '0 2px 8px #e6eaf1' }}>
                Общайтесь с агентом по этому объекту. Все сообщения приватны и доступны только участникам сделки.
              </div>
              <div style={{ margin: '0 0 0 0', maxHeight: 340, minHeight: 220, overflowY: 'auto', borderRadius: 16, background: 'rgba(255,255,255,0.85)', boxShadow: '0 2px 8px #e6eaf1' }}>
                <ChatWidget
                  chatId={property.chatId}
                  userId={authContext?.user?.id || 0}
                  jwt={authContext?.token || ''}
                  propertyId={property.id}
                  sellerId={property.agent?.id || 0}
                  buyerId={authContext?.user?.id}
                  limitLastN={5}
                />
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default PropertyDetailsPageClean;