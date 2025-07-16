import React, { useState, useContext, useRef, useCallback } from 'react';
import { Card, Carousel, Tag, Button, Tooltip, Modal, Form, Select, Space, Typography, Skeleton, Badge } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Property } from '../types';
import { MessageOutlined, PlusOutlined, HeartOutlined, HeartFilled, EyeOutlined, EditOutlined, DeleteOutlined, UserOutlined, PropertySafetyOutlined, WarningOutlined, SyncOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import AddToSelectionModal from './AddToSelectionModal';
import { updatePropertyStatus } from '../services/property.service';
import { AuthContext } from '../context/AuthContext';
import { useClientMode } from '../context/ClientModeContext';
import OptimizedImage from './OptimizedImage';
import styles from './GlassCard.module.css';
import { message } from 'antd';

const { Text, Title } = Typography;

const statusOptions = [
  { value: 'for_sale', label: 'В продаже', color: 'green' },
  { value: 'in_deal', label: 'На задатке', color: 'orange' },
  { value: 'reserved', label: 'На брони', color: 'blue' },
  { value: 'sold', label: 'Продан', color: 'red' },
];

type PropertyCardProps = {
  property: Property;
  onStatusChange?: (id: number, status: string, property: Property) => void;
  mode?: 'default' | 'compact' | 'avito';
  onFavorite?: (propertyId: number) => void;
  onEdit?: (propertyId: number) => void;
  onDelete?: (propertyId: number) => void;
  isFavorite?: boolean;
  loading?: boolean;
  showActions?: boolean;
  allowStatusEdit?: boolean;
  style?: React.CSSProperties;
};

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

function getThumbnail(photo: string | undefined): string | undefined {
  if (!photo) return undefined;
  if (photo.startsWith('/uploads/objects/')) {
    const parts = photo.split('/');
    // вставляем 'thumbnails' после 'objects'
    return ['/uploads', 'objects', 'thumbnails', ...parts.slice(3)].join('/');
  }
  return undefined;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onStatusChange,
  mode = 'default',
  onFavorite,
  onEdit,
  onDelete,
  isFavorite = false,
  loading = false,
  showActions = true,
  allowStatusEdit = true,
  style,
}) => {
  const images: string[] = normalizePhotos(property.photos) || property.images || [];
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(property.status);
  const auth = useContext(AuthContext);
  const currentUser = auth?.user;
  const { isClientMode } = useClientMode();
  const carouselRef = useRef<any>(null);
  const [lastDirection, setLastDirection] = useState<'left' | 'right' | null>(null);
  const [hovered, setHovered] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragLastX, setDragLastX] = useState<number | null>(null);
  const [lastSegment, setLastSegment] = useState<number | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const currentUserId = auth?.user?.id;
  const agentId = property.agent?.id;
  const propertyId = property.id;
  const roomName = propertyId && currentUserId && agentId && currentUserId !== agentId
    ? `property-${propertyId}-agent-${currentUserId < agentId ? currentUserId + '-' + agentId : agentId + '-' + currentUserId}`
    : '';
  const rocketChatUrl = roomName ? `https://open.rocket.chat/channel/${roomName}` : '';

  // Агент может менять статус только если он привязан к объекту
  const canEditStatus =
    allowStatusEdit &&
    currentUser &&
    currentUser.role === 'agent' &&
    property.agent &&
    property.agent.id === currentUser.id;

  // Проверяем, доступен ли чат для этого объекта (только если агент не сам себе)
  const isChatAvailable = property.agent && currentUser && property.agent.id !== currentUser.id;

  const currentStatus = statusOptions.find(opt => opt.value === property.status) || statusOptions[0];

  const handleTagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStatus(property.status);
    setStatusModalOpen(true);
  };

  const handleSaveStatus = async (newStatus?: string) => {
    setStatusModalOpen(false);
    const statusToSet = newStatus || selectedStatus;
    if (statusToSet !== property.status) {
      try {
        console.log('Отправка запроса на смену статуса:', statusToSet);
        const updated = await updatePropertyStatus(property.id, statusToSet, auth?.token || undefined);
        onStatusChange && onStatusChange(property.id, updated.status, updated);
        message.success('Статус успешно обновлён!');
      } catch (error: any) {
        console.error('Ошибка смены статуса:', error);
        const errorMsg = error?.response?.data?.message || error.message || 'Не удалось обновить статус';
        message.error(errorMsg);
      }
    }
  };

  // --- Логика для mouse move: листаем по сегментам ширины ---
  const handleMouseMoveSlider = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, images: string[]) => {
    if (!images.length || !carouselRef.current) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const segmentCount = images.length;
    const segmentWidth = rect.width / segmentCount;
    const currentSegment = Math.floor(x / segmentWidth);
    if (lastSegment === null) {
      setLastSegment(currentSegment);
      setDragLastX(x);
      return;
    }
    if (currentSegment > lastSegment) {
      carouselRef.current.next();
      setLastSegment(currentSegment);
    } else if (currentSegment < lastSegment) {
      carouselRef.current.prev();
      setLastSegment(currentSegment);
    }
    setDragLastX(x);
  };
  const handleMouseLeaveSlider = () => {
    setDragStartX(null);
    setDragLastX(null);
    setLastSegment(null);
    setLastDirection(null);
    setHovered(false);
  };

  const handleCardClick = useCallback(() => {
    navigate(`/properties/${property.id}`);
  }, [navigate, property.id]);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite?.(property.id);
  }, [onFavorite, property.id]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(property.id);
  }, [onEdit, property.id]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(property.id);
  }, [onDelete, property.id]);

  // --- Слайдер для фото ---
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ startX: 0, dragging: false, lastX: 0 });

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    dragState.current.dragging = true;
    if ('touches' in e) {
      const evt = e as unknown as React.TouchEvent;
      if (evt.touches && evt.touches.length > 0) {
        dragState.current.startX = evt.touches[0].clientX;
        dragState.current.lastX = evt.touches[0].clientX;
      }
    } else {
      const evt = e as React.MouseEvent;
      dragState.current.startX = evt.clientX;
      dragState.current.lastX = evt.clientX;
    }
  };
  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragState.current.dragging) return;
    let x;
    if ('touches' in e) {
      const evt = e as unknown as React.TouchEvent;
      if (evt.touches && evt.touches.length > 0) {
        x = evt.touches[0].clientX;
      } else {
        return;
      }
    } else {
      const evt = e as React.MouseEvent;
      x = evt.clientX;
    }
    const dx = x - dragState.current.lastX;
    dragState.current.lastX = x;
    // Можно добавить визуальный сдвиг, если нужно
  };
  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragState.current.dragging) return;
    dragState.current.dragging = false;
    let endX;
    if ('changedTouches' in e) {
      const evt = e as unknown as React.TouchEvent;
      if (evt.changedTouches && evt.changedTouches.length > 0) {
        endX = evt.changedTouches[0].clientX;
      } else {
        return;
      }
    } else if ('touches' in e) {
      const evt = e as unknown as React.TouchEvent;
      if (evt.touches && evt.touches.length > 0) {
        endX = evt.touches[0].clientX;
      } else {
        return;
      }
    } else {
      const evt = e as React.MouseEvent;
      endX = evt.clientX;
    }
    const delta = endX - dragState.current.startX;
    if (Math.abs(delta) > 40) {
      if (delta < 0 && currentSlide < images.length - 1) setCurrentSlide(currentSlide + 1);
      if (delta > 0 && currentSlide > 0) setCurrentSlide(currentSlide - 1);
    }
  };
  const goToPrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };
  const goToNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentSlide < images.length - 1) setCurrentSlide(currentSlide + 1);
  };

  if (loading) {
    return (
      <Card style={{ width: 300, marginBottom: 16, ...style }}>
        <Skeleton.Image active style={{ width: '100%', height: 200 }} />
        <Skeleton active paragraph={{ rows: 3 }} />
      </Card>
    );
  }

  const mainImage = (property.photos && Array.isArray(property.photos) && property.photos[0])
    || (typeof property.photos === 'string' && (() => { try { const arr = JSON.parse(property.photos); return Array.isArray(arr) && arr[0] ? arr[0] : null; } catch { return null; } })())
    || '/placeholder-property.jpg';

  // Форматирование цены с пробелами
  const formatPrice = (price?: number | string) => {
    const num = Number(price);
    if (!num || isNaN(num)) return '—';
    return num.toLocaleString('ru-RU') + ' руб';
  };

  // Новый единый стиль карточки:
  const isModalActive = modalOpen || phoneModalOpen;

  // --- Кнопки для связи через мессенджеры ---
  const renderAgentMessengers = () => {
    if (!property.agent) return null;
    let { telegramUsername, whatsappNumber } = property.agent;
    // Удаляем символ @ в начале username, если он есть
    if (telegramUsername) {
      telegramUsername = telegramUsername.replace(/^@/, '');
    }
    return (
      <Space style={{ marginTop: 8 }}>
        {telegramUsername && (
          <a href={`https://t.me/${telegramUsername}`} target="_blank" rel="noopener noreferrer">
            <img src="/telegram-icon.svg" alt="Telegram" style={{ width: 24, height: 24 }} />
          </a>
        )}
        {whatsappNumber && (
          <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
            <img src="/whatsapp-icon.svg" alt="WhatsApp" style={{ width: 24, height: 24 }} />
          </a>
        )}
      </Space>
    );
  };

  const legalStatus = property.legalCheck?.status || 'Не проверен';
  let legalIcon = <PropertySafetyOutlined style={{ fontSize: 20, color: '#faad14' }} />;
  let legalColor = '#faad14';
  let legalText = 'Не проверен';
  if (legalStatus === 'Проверен') {
    legalIcon = <PropertySafetyOutlined style={{ fontSize: 20, color: '#52c41a' }} />;
    legalColor = '#52c41a';
    legalText = 'Проверен';
  } else if (legalStatus === 'На проверке') {
    legalIcon = <SyncOutlined spin style={{ fontSize: 20, color: '#1890ff' }} />;
    legalColor = '#1890ff';
    legalText = 'На проверке';
  }

  if (mode === 'avito') {
    return (
      <div
        className={styles.avitoCard}
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #e6eaf1', minHeight: 120, margin: '12px 0', padding: 0, cursor: isModalActive ? 'default' : 'pointer', transition: 'box-shadow 0.18s', width: '100%', maxWidth: '100%' }}
        onClick={() => navigate(`/properties/${property.id}`)}
      >
        <div style={{ width: 100, height: 100, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f5f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 14 }}>
          <OptimizedImage
            src={mainImage}
            alt={property.title}
            preview={false}
            width={100}
            height={100}
            style={{ objectFit: 'cover', width: 100, height: 100, borderRadius: 10 }}
            lazy={true}
            fallback="/placeholder-property.jpg"
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px 18px 16px 0', minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#222', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatPrice(property.price)}</div>
          <div style={{ fontSize: 16, color: '#222', fontWeight: 600, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>{property.title}</div>
          <div style={{ fontSize: 14, color: '#888', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 4, lineHeight: 1.2 }}>
            <span role="img" aria-label="address">📍</span> {property.address}
          </div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 8, display: 'flex', gap: 14, lineHeight: 1.2 }}>
            <span>{property.area} м²</span>
            {property.floor && property.floors && (
              <span>{property.floor}/{property.floors} эт.</span>
            )}
            {property.type && <span>{property.type}</span>}
          </div>
          {/* Блок юридической чистоты — современный стиль */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            margin: '14px 0 10px 0',
            padding: '14px 18px',
            background: '#fff',
            borderRadius: 14,
            boxShadow: '0 2px 12px #e6eaf133',
            maxWidth: 420,
            minHeight: 56,
          }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>
              {legalIcon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: legalColor, marginBottom: 2 }}>
                Юридическая чистота: {legalText}
              </span>
              {property.legalCheck?.details && <span style={{ color: '#888', fontSize: 12 }}>{property.legalCheck.details}</span>}
              {property.legalCheck?.date && <span style={{ color: '#b0b6c3', fontSize: 11 }}>{property.legalCheck?.date}</span>}
            </div>
          </div>
          {!isClientMode && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                {property.agent?.photo && (
                  <picture>
                    {property.agent.photo.match(/\.(jpg|jpeg|png)$/i) && (
                      <source srcSet={property.agent.photo} type="image/jpeg" />
                    )}
                    <img src={property.agent.photo} alt="Агент" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 1px 4px #e6eaf1' }} loading="lazy" />
                  </picture>
                )}
                <span style={{ fontSize: 14, color: '#888', fontWeight: 500 }}>{property.agent?.firstName} {property.agent?.lastName}</span>
                {property.agent?.phone && (
                  <span style={{ fontSize: 14, color: '#1976d2', marginLeft: 8 }}>{property.agent.phone}</span>
                )}
              </div>
              {renderAgentMessengers()}
            </>
          )}
        </div>
        <AddToSelectionModal open={modalOpen} propertyId={property.id} onClose={() => setModalOpen(false)} />
      </div>
    );
  }

  if (mode === 'compact') {
    return (
      <div
        className={styles.glassCard}
        style={{ margin: 6, boxShadow: '0 2px 8px 0 rgba(10,37,64,0.06)', cursor: isModalActive ? 'default' : 'pointer', minWidth: 0, minHeight: 0, maxWidth: 360 }}
        {...(!isModalActive ? { onClick: handleCardClick } : {})}
      >
        <div
          className={styles.cardImage}
          style={{ height: 90, borderRadius: 10, position: 'relative', overflow: 'hidden', userSelect: 'none' }}
          ref={sliderRef}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          {images.length > 1 ? (
            <>
              <img
                src={images[currentSlide] || '/placeholder-property.jpg'}
                alt={property.title}
                style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 10, transition: '0.3s' }}
                draggable={false}
              />
              {/* Стрелки */}
              {currentSlide > 0 && (
                <Button
                  type="default"
                  shape="circle"
                  icon={<LeftOutlined />}
                  size="small"
                  style={{ position: 'absolute', top: '50%', left: 6, transform: 'translateY(-50%)', zIndex: 2, background: '#fff', opacity: 0.8 }}
                  onClick={goToPrev}
                  tabIndex={-1}
                />
              )}
              {currentSlide < images.length - 1 && (
                <Button
                  type="default"
                  shape="circle"
                  icon={<RightOutlined />}
                  size="small"
                  style={{ position: 'absolute', top: '50%', right: 6, transform: 'translateY(-50%)', zIndex: 2, background: '#fff', opacity: 0.8 }}
                  onClick={goToNext}
                  tabIndex={-1}
                />
              )}
              {/* Индикаторы */}
              <div style={{ position: 'absolute', bottom: 6, left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: 4 }}>
                {images.map((_, idx) => (
                  <span key={idx} style={{ width: 8, height: 8, borderRadius: '50%', background: idx === currentSlide ? '#1976d2' : '#eee', display: 'inline-block' }} />
                ))}
              </div>
            </>
          ) : (
            <OptimizedImage
              src={mainImage}
              alt={property.title}
              preview={false}
              width="100%"
              height={90}
              style={{ objectFit: 'cover', borderRadius: 10 }}
              lazy={true}
              fallback="/placeholder-property.jpg"
            />
          )}
        </div>
        <div className={styles.cardContent} style={{ padding: '10px 12px 8px 12px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{property.title}</div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{property.address}</div>
          <div style={{ fontSize: 15, color: '#1976d2', fontWeight: 600, marginBottom: 2 }}>{formatPrice(property.price)}</div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 2 }}>{property.area} м²</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.glassCard + (isModalActive ? ' ' + styles.active : '')}
      style={{ cursor: 'pointer', minHeight: (mode as string) === 'compact' ? 60 : 120, padding: (mode as string) === 'compact' ? 8 : undefined, fontSize: (mode as string) === 'compact' ? 14 : undefined, ...style }}
      onClick={handleCardClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeaveSlider}
    >
      <div data-testid={`property-card-${property.id}`}>
        <div
          className={styles.cardImage}
          style={{ position: 'relative', overflow: 'hidden', userSelect: 'none', borderRadius: 16, height: 220 }}
          ref={sliderRef}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          {images.length > 1 ? (
            <>
              <img
                src={images[currentSlide] || '/placeholder-property.jpg'}
                alt={property.title}
                style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 16, transition: '0.3s' }}
                draggable={false}
              />
              {/* Стрелки */}
              {currentSlide > 0 && (
                <Button
                  type="default"
                  shape="circle"
                  icon={<LeftOutlined />}
                  size="small"
                  style={{ position: 'absolute', top: '50%', left: 10, transform: 'translateY(-50%)', zIndex: 2, background: '#fff', opacity: 0.8 }}
                  onClick={goToPrev}
                  tabIndex={-1}
                />
              )}
              {currentSlide < images.length - 1 && (
                <Button
                  type="default"
                  shape="circle"
                  icon={<RightOutlined />}
                  size="small"
                  style={{ position: 'absolute', top: '50%', right: 10, transform: 'translateY(-50%)', zIndex: 2, background: '#fff', opacity: 0.8 }}
                  onClick={goToNext}
                  tabIndex={-1}
                />
              )}
              {/* Индикаторы */}
              <div style={{ position: 'absolute', bottom: 10, left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: 4 }}>
                {images.map((_, idx) => (
                  <span key={idx} style={{ width: 10, height: 10, borderRadius: '50%', background: idx === currentSlide ? '#1976d2' : '#eee', display: 'inline-block' }} />
                ))}
              </div>
            </>
          ) : (
            <OptimizedImage
              src={mainImage}
              alt={property.title}
              preview={false}
              width="100%"
              height={220}
              style={{ objectFit: 'cover', borderRadius: 16 }}
              lazy={true}
              fallback="/placeholder-property.jpg"
            />
          )}
          <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 2, display: 'flex', gap: 8 }}>
            {canEditStatus ? (
              <Select
                size="small"
                value={property.status}
                style={{ minWidth: 110 }}
                onChange={async val => {
                  setSelectedStatus(val);
                  await handleSaveStatus(val);
                }}
                options={statusOptions}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <Tag color={currentStatus.color} style={{ fontWeight: 600, fontSize: 13 }}>{currentStatus.label}</Tag>
            )}
            {/* Плашка эксклюзивный объект всегда */}
            <Tag color="purple" style={{ fontWeight: 600, fontSize: 13 }}>Эксклюзивный объект</Tag>
          </div>
        </div>
        <div className={styles.cardContent} style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Название и адрес */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#222', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{property.title}</div>
            <div style={{ fontSize: 13, color: '#888', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{property.address}</div>
          </div>
          {/* Цена и площадь */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 16, color: '#2563eb', fontWeight: 700 }}>{formatPrice(property.price)}</div>
            <div style={{ fontSize: 13, color: '#444', fontWeight: 600 }}>{property.area} м²</div>
          </div>
          {/* Характеристики */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#666', marginBottom: 0 }}>
            {property.bedrooms !== undefined && <span><i className="fas fa-bed" style={{ marginRight: 3 }} />{property.bedrooms} спален</span>}
            {property.bathrooms !== undefined && <span><i className="fas fa-bath" style={{ marginRight: 3 }} />{property.bathrooms} ванн</span>}
            {property.type && <span><i className="fas fa-home" style={{ marginRight: 3 }} />{property.type}</span>}
            {property.floor && property.totalFloors && <span><i className="fas fa-layer-group" style={{ marginRight: 3 }} />{property.floor}/{property.totalFloors} эт.</span>}
          </div>
          {/* Описание с кнопкой 'Читать далее' если длинное — теперь между характеристиками и юридической чистотой */}
          {property.description && (
            <DescriptionWithReadMore text={property.description} maxLines={4} />
          )}
          {/* Блок юридической чистоты — сразу после описания */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            margin: '6px 0 4px 0',
            padding: '7px 10px',
            background: '#fff',
            borderRadius: 10,
            boxShadow: '0 1px 4px #e6eaf122',
            maxWidth: 320,
            minHeight: 32,
          }}>
            <div style={{ fontSize: 16, flexShrink: 0 }}>
              {legalIcon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 11, color: legalColor, marginBottom: 0 }}>
                Юридическая чистота: {legalText}
              </span>
              {property.legalCheck?.details && <span style={{ color: '#888', fontSize: 10 }}>{property.legalCheck.details}</span>}
              {property.legalCheck?.date && <span style={{ color: '#b0b6c3', fontSize: 9 }}>{property.legalCheck?.date}</span>}
            </div>
          </div>
          {/* Агент и агентство + действия — в одной строке */}
          {!isClientMode && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 3, marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {property.agent?.photo && (
                  <picture>
                    {property.agent.photo.match(/\.(jpg|jpeg|png)$/i) && (
                      <source srcSet={property.agent.photo} type="image/jpeg" />
                    )}
                    <img src={property.agent.photo} alt="Агент" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 1px 4px #e6eaf1' }} loading="lazy" />
                  </picture>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{property.agent?.firstName} {property.agent?.lastName}</span>
                  {property.agent?.agency?.name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {property.agent?.agency?.logo && (
                        <img 
                          src={property.agent.agency.logo} 
                          alt="Логотип агентства" 
                          style={{ 
                            width: 16, 
                            height: 16, 
                            objectFit: 'contain',
                            borderRadius: 2
                          }} 
                        />
                      )}
                      <span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{property.agent.agency.name}</span>
                    </div>
                  )}
                  <span style={{ color: '#888', fontSize: 12 }}>{property.agent?.phone}</span>
                  <span>{renderAgentMessengers()}</span>
                </div>
              </div>
              {/* Действия справа */}
              <div className={styles.cardActions} style={{ display: 'flex', gap: 6, marginTop: 0, marginBottom: 0 }}>
                <Tooltip title="Добавить в подбор">
                  <Button
                    shape="circle"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={e => { e.stopPropagation(); setModalOpen(true); }}
                  />
                </Tooltip>
                <Tooltip title="Позвонить агенту">
                  <Button
                    shape="circle"
                    icon={<PhoneIcon />}
                    size="large"
                    onClick={e => { e.stopPropagation(); setPhoneModalOpen(true); }}
                  />
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      </div>
      <AddToSelectionModal open={modalOpen} propertyId={property.id} onClose={() => setModalOpen(false)} />
      {!isClientMode && (
        <Modal
          open={phoneModalOpen}
          onCancel={(e: React.MouseEvent) => { e.stopPropagation(); setPhoneModalOpen(false); }}
          footer={null}
          title="Контакт агента"
          afterClose={() => {}}
          maskClosable={true}
          destroyOnClose
        >
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            {property.agent?.firstName} {property.agent?.lastName}
          </div>
          {property.agent?.agency?.name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              {property.agent?.agency?.logo && (
                <img 
                  src={property.agent.agency.logo} 
                  alt="Логотип агентства" 
                  style={{ 
                    width: 24, 
                    height: 24, 
                    objectFit: 'contain',
                    borderRadius: 4
                  }} 
                />
              )}
              <span style={{ fontSize: 16, color: '#666' }}>{property.agent.agency.name}</span>
            </div>
          )}
          <div style={{ fontSize: 16 }}>
            {property.agent?.phone || property.phone || 'Телефон не указан'}
          </div>
        </Modal>
      )}
    </div>
  );
};

const PhoneIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Добавляю компонент DescriptionWithReadMore
const DescriptionWithReadMore: React.FC<{ text: string; maxLines?: number }> = ({ text, maxLines = 4 }) => {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [truncated, setTruncated] = useState(false);

  React.useEffect(() => {
    if (ref.current) {
      setTruncated(ref.current.scrollHeight > ref.current.clientHeight + 2);
    }
  }, [text, maxLines]);

  return (
    <div style={{ position: 'relative', marginTop: 4 }}>
      <div
        ref={ref}
        style={{
          fontSize: 12,
          color: '#444',
          lineHeight: 1.5,
          maxHeight: expanded ? 'none' : `${maxLines * 1.5 * 1.1}em`,
          overflow: expanded ? 'visible' : 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : maxLines,
          WebkitBoxOrient: 'vertical',
          whiteSpace: 'pre-line',
          background: 'none',
          padding: 0,
        }}
      >
        {text}
      </div>
      {!expanded && truncated && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 32,
          background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 90%)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}>
          <Button size="small" type="link" style={{ fontSize: 12, padding: 0 }} onClick={() => setExpanded(true)}>Читать далее</Button>
        </div>
      )}
      {expanded && (
        <Button size="small" type="link" style={{ fontSize: 12, padding: 0, marginTop: 2 }} onClick={() => setExpanded(false)}>Скрыть</Button>
      )}
    </div>
  );
};

// Сравнение пропсов для мемоизации PropertyCard
function areEqual(prevProps: PropertyCardProps, nextProps: PropertyCardProps) {
  // Сравниваем id property и основные пропсы
  return (
    prevProps.property.id === nextProps.property.id &&
    prevProps.property.updatedAt === nextProps.property.updatedAt &&
    prevProps.mode === nextProps.mode &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.loading === nextProps.loading &&
    prevProps.showActions === nextProps.showActions &&
    prevProps.allowStatusEdit === nextProps.allowStatusEdit
  );
}

export default React.memo(PropertyCard, areEqual);