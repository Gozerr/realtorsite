import React from 'react';
import { List, Card, Spin, Input, Button, InputNumber, Select, Carousel, Modal, Avatar } from 'antd';
import UniversalMapYandex from '../components/UniversalMapYandex';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CloseOutlined, ArrowLeftOutlined, PlusOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';
import { usePropertiesContext } from '../context/PropertiesContext';
import { useClientMode } from '../context/ClientModeContext';
import { FixedSizeList as VirtualList } from 'react-window';
import { Skeleton } from 'antd';
import { useState } from 'react';
import AddToSelectionModal from '../components/AddToSelectionModal';
import OptimizedImage from '../components/OptimizedImage';
import PropertyCard from '../components/PropertyCard';

const statusOptions = [
  { value: 'for_sale', label: 'В продаже' },
  { value: 'in_deal', label: 'На задатке' },
  { value: 'reserved', label: 'На брони' },
  { value: 'sold', label: 'Продан' },
];
const typeOptions = [
  { value: 'apartment', label: 'Квартира' },
  { value: 'house', label: 'Дом' },
  { value: 'commercial', label: 'Коммерция' },
  { value: 'land', label: 'Участок' },
];

export default function MapSearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = React.useContext(AuthContext);
  const { isClientMode } = useClientMode();
  const {
    filters,
    updateFilters,
    resetFilters,
    bbox,
    setBbox,
    properties,
    loading,
    selectedId,
    setSelectedId,
    center,
    setCenter
  } = usePropertiesContext();
  const [activeTab, setActiveTab] = React.useState<'active' | 'archive'>(
    new URLSearchParams(location.search).get('tab') === 'archive' ? 'archive' : 'active'
  );
  const [show, setShow] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const initializedRef = React.useRef(false);
  const [delayedLoading, setDelayedLoading] = React.useState(false);
  const loadingTimeout = React.useRef<any>(null);
  const minShowTimeout = React.useRef<any>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [addToSelectionId, setAddToSelectionId] = useState<number | null>(null);
  const [agentModal, setAgentModal] = useState<{ open: boolean; agent: any } | null>(null);
  const cardRefs = React.useRef<{ [id: number]: HTMLDivElement | null }>({});

  React.useEffect(() => {
    setTimeout(() => setShow(true), 10); // для плавной анимации
  }, []);

  // Инициализация состояния из URL
  React.useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const bboxParam = searchParams.get('bbox');
    const selectedIdParam = searchParams.get('selectedId');
    const filtersParam = searchParams.get('filters');
    if (bboxParam) {
      const arr = bboxParam.split(',').map(Number);
      if (arr.length === 4 && arr.every(x => !isNaN(x))) setBbox(arr as any);
    }
    if (selectedIdParam) setSelectedId(Number(selectedIdParam));
    if (filtersParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(filtersParam));
        updateFilters(parsed);
      } catch {}
    }
  }, [searchParams, setBbox, setSelectedId, updateFilters]);

  // Сохранять состояние в URL при изменении
  React.useEffect(() => {
    const params: any = {};
    if (bbox) params.bbox = bbox.join(',');
    if (selectedId) params.selectedId = selectedId;
    if (Object.keys(filters).length > 0) params.filters = encodeURIComponent(JSON.stringify(filters));
    setSearchParams(params);
  }, [bbox, selectedId, filters]);

  // Фильтрация по табу (активные/архив)
  let filteredProperties = properties.filter(p =>
    activeTab === 'active' ? p.status !== 'sold' : p.status === 'sold'
  );
  if (bbox && Array.isArray(bbox) && bbox.length === 4) {
    filteredProperties = filteredProperties.filter(p => {
      if (typeof p.lat !== 'number' || typeof p.lng !== 'number') return false;
      const [minLng, minLat, maxLng, maxLat] = bbox;
      return p.lat >= minLat && p.lat <= maxLat && p.lng >= minLng && p.lng <= maxLng;
    });
  }

  // При изменении границ карты обновлять bbox
  const handleBoundsChange = (bboxArr: [number, number, number, number]) => {
    setBbox(bboxArr);
  };

  React.useEffect(() => {
    if (loading) {
      // Показываем спиннер только если загрузка дольше 250мс
      loadingTimeout.current = setTimeout(() => {
        setDelayedLoading(true);
        // После появления держим минимум 400мс
        minShowTimeout.current = setTimeout(() => {}, 400);
      }, 250);
    } else {
      if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
      if (delayedLoading) {
        // Если спиннер уже показан, держим его минимум 400мс
        if (minShowTimeout.current) {
          setTimeout(() => setDelayedLoading(false), 400);
          clearTimeout(minShowTimeout.current);
        } else {
          setDelayedLoading(false);
        }
      }
    }
    return () => {
      if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
      if (minShowTimeout.current) clearTimeout(minShowTimeout.current);
    };
  }, [loading]);

  // Определяем, показывать windowing или обычный список
  const maxListCount = 300;
  const isFullCity = !bbox || (bbox && Math.abs(bbox[2] - bbox[0]) > 0.5 && Math.abs(bbox[3] - bbox[1]) > 0.5); // bbox > ~0.5 градуса — весь город
  const listToShow = isFullCity ? filteredProperties : filteredProperties.slice(0, maxListCount);
  const tooMany = listToShow.length > maxListCount;

  function getThumbnail(photo: string | undefined): string | undefined {
    if (!photo) return undefined;
    if (photo.startsWith('/uploads/objects/')) {
      const parts = photo.split('/');
      return ['/uploads', 'objects', 'thumbnails', ...parts.slice(3)].join('/');
    }
    return undefined;
  }

  // Скролл к выбранной карточке
  React.useEffect(() => {
    if (selectedId && cardRefs.current[selectedId]) {
      cardRefs.current[selectedId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedId]);

  return (
    <div className={`big-map-page${show ? ' big-map-page--show' : ''}`} style={{ display: 'flex', height: 'calc(100vh - 80px)', position: 'relative', transition: 'background 0.5s' }}>
      {/* Список объектов слева */}
      <div style={{ width: 340, overflowY: 'auto', background: '#fff', borderRight: '1px solid #eee', padding: 8, display: 'flex', flexDirection: 'column', transition: 'transform 0.5s', transform: show ? 'translateX(0)' : 'translateX(-100%)', opacity: show ? 1 : 0 }}>
        {/* Фильтры */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: 300 }}>
          <Button type="default" size="small" style={{ marginBottom: 8 }} onClick={() => setFiltersOpen(v => !v)}>
            {filtersOpen ? 'Скрыть фильтры' : 'Показать фильтры'}
          </Button>
          <div style={{ transition: 'max-height 0.3s, opacity 0.3s', overflow: 'hidden', maxHeight: filtersOpen ? 400 : 0, opacity: filtersOpen ? 1 : 0 }}>
            <div style={{ marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input.Search
                placeholder="Поиск по адресу или названию..."
                value={filters.search || ''}
                onChange={e => updateFilters({ search: e.target.value })}
                allowClear
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <InputNumber placeholder="Цена от" min={0} value={filters.minPrice} onChange={v => updateFilters({ minPrice: v === null ? undefined : v })} style={{ width: 100 }} />
                <InputNumber placeholder="до" min={0} value={filters.maxPrice} onChange={v => updateFilters({ maxPrice: v === null ? undefined : v })} style={{ width: 100 }} />
                <InputNumber placeholder="Площадь от" min={0} value={filters.minArea} onChange={v => updateFilters({ minArea: v === null ? undefined : v })} style={{ width: 100 }} />
                <InputNumber placeholder="до" min={0} value={filters.maxArea} onChange={v => updateFilters({ maxArea: v === null ? undefined : v })} style={{ width: 100 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Select
                  placeholder="Статус"
                  allowClear
                  value={filters.status}
                  onChange={v => updateFilters({ status: v })}
                  options={statusOptions}
                  style={{ width: 120 }}
                />
                <Select
                  placeholder="Тип"
                  allowClear
                  value={filters.type}
                  onChange={v => updateFilters({ type: v })}
                  options={typeOptions}
                  style={{ width: 120 }}
                />
              </div>
              <Button onClick={resetFilters} style={{ borderRadius: 8, fontWeight: 500, marginTop: 8 }}>Сбросить</Button>
            </div>
          </div>
        </div>
        {/* Список объектов */}
        <div style={{ background: '#fafbfc', padding: '8px 0', borderRadius: 12, minHeight: 400 }}>
          {tooMany && (
            <div style={{ color: '#ff9800', fontWeight: 500, textAlign: 'center', marginBottom: 12 }}>
              Показаны только первые {maxListCount} объектов для ускорения работы
            </div>
          )}
          {listToShow.map((item, index) => (
            <React.Fragment key={item.id}>
              <div
                ref={el => { cardRefs.current[item.id] = el; }}
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  padding: '0 4px',
                  width: '100%',
                  maxWidth: '100%',
                  marginBottom: 8,
                  background: item.id === selectedId ? '#e6f0ff' : 'transparent',
                  borderRadius: 10,
                  boxShadow: item.id === selectedId ? '0 0 0 2px #1976d2' : 'none',
                  transition: 'background 0.2s, box-shadow 0.2s',
                  position: 'relative',
                  cursor: 'pointer',
                  minHeight: 72,
                }}
                onClick={() => setSelectedId(item.id)}
              >
                <PropertyCard
                  property={item}
                  mode="compact"
                  showActions={false}
                  style={{ fontSize: 14, minHeight: 60, padding: 8 }}
                />
                {/* Кнопка телефон */}
                {!isClientMode && (
                  <Button
                    type="default"
                    icon={<PhoneOutlined />}
                    style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 2, borderRadius: 8, fontWeight: 600, height: 32, width: 32, minWidth: 32, padding: 0, fontSize: 16 }}
                    onClick={e => { e.stopPropagation(); setAgentModal({ open: true, agent: item.agent }); }}
                  />
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      {/* Карта */}
      <div style={{ flex: 1, transition: 'all 0.5s', opacity: show ? 1 : 0, position: 'relative' }}>
        {/* Кнопка возврата теперь на самой карте */}
        <Button
          type="default"
          icon={<ArrowLeftOutlined style={{ fontSize: 22 }} />}
          onClick={() => navigate('/properties')}
          style={{ position: 'absolute', top: 24, right: 24, zIndex: 1000, background: '#fff', borderRadius: '50%', boxShadow: '0 2px 8px rgba(40,60,90,0.10)', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Вернуться к списку"
        />
        {/* Спиннер только на карте */}
        {delayedLoading && (
          <div style={{ position: 'absolute', left: '50%', top: '50%', zIndex: 1001, transform: 'translate(-50%, -50%)' }}>
            <Spin size="large" />
          </div>
        )}
        <UniversalMapYandex
          properties={filteredProperties}
          selectedId={selectedId}
          onSelect={setSelectedId}
          initialCenter={center}
          initialZoom={12}
          onBoundsChange={handleBoundsChange}
          style={{ height: '100%', width: '100%' }}
        />
      </div>
      <AddToSelectionModal open={!!addToSelectionId} propertyId={addToSelectionId || undefined} onClose={() => setAddToSelectionId(null)} />
      {/* Модальное окно агента */}
      {!isClientMode && (
        <Modal
          open={!!agentModal?.open}
          onCancel={() => setAgentModal(null)}
          footer={null}
          title="Информация об агенте"
        >
          {agentModal?.agent ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <Avatar size={64} src={agentModal.agent.photo} icon={<UserOutlined />} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{agentModal.agent.firstName} {agentModal.agent.lastName}</div>
                <div style={{ color: '#1976d2', fontSize: 17, margin: '4px 0', fontWeight: 500 }}><PhoneOutlined /> {agentModal.agent.phone}</div>
                <div style={{ color: '#888', fontSize: 15 }}>{agentModal.agent.email || '—'}</div>
              </div>
            </div>
          ) : (
            <div>Нет информации об агенте</div>
          )}
        </Modal>
      )}
      <style>{`
        .big-map-page {
          background: #f8fafc;
        }
        .big-map-page--show {
          background: #e9f0fb;
        }
        @media (max-width: 767px) {
          .map-filters {
            flex-direction: column !important;
            gap: 8px !important;
            padding: 12px !important;
          }
          .ant-btn, .ant-input, .ant-select {
            font-size: 18px !important;
            height: 48px !important;
          }
        }
      `}</style>
    </div>
  );
} 