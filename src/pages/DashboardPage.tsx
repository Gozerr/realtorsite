import React, { useEffect, useState, useRef } from 'react';
import { getRecentProperties } from '../services/property.service';
import { Property } from '../types';
import Mapbox3DMap from '../components/Mapbox3DMap';
import { Popover, Button, Input, InputNumber, Select, Checkbox, Tooltip } from 'antd';
import { FilterOutlined, PictureOutlined, SearchOutlined, HomeOutlined, NumberOutlined, ExpandOutlined, ApartmentOutlined, CarOutlined, BuildOutlined, CalendarOutlined, PictureOutlined as PictureIcon, DownOutlined, UpOutlined, ReloadOutlined } from '@ant-design/icons';
import AddToSelectionModal from '../components/AddToSelectionModal';
import { Tag, Modal, Avatar, Space, Typography } from 'antd';
import { PropertySafetyOutlined, SyncOutlined, PhoneOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useClientMode } from '../context/ClientModeContext';
// REMOVE: import PropertyCardCompact from '../components/PropertyCardCompact';

const DEFAULT_CENTER: [number, number] = [57.6261, 39.8845]; // Ярославль
const DEFAULT_ZOOM = 12;
const STORAGE_KEY = 'mapbox_last_view';

// Функция для вычисления расстояния между двумя точками (haversine)
function getDistance([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // Радиус Земли в км
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
// Функция для динамического радиуса (чем больше zoom, тем меньше радиус)
function getRadiusByZoom(zoom: number | null): number {
  if (!zoom) return 10;
  if (zoom >= 16) return 0.5;
  if (zoom >= 14) return 1.2;
  if (zoom >= 12) return 2.5;
  if (zoom >= 10) return 5;
  return 10;
}

// Функция для tolerance (допуска) в метрах в зависимости от зума
function getToleranceByZoom(zoom: number): number {
  if (zoom >= 16) return 10;
  if (zoom >= 14) return 25;
  if (zoom >= 12) return 50;
  if (zoom >= 10) return 100;
  return 200;
}
// Функция для перевода метров в градусы (очень грубо, для Ярославля)
function metersToDegrees(meters: number): number {
  // 1 градус ~ 111320 метров (по широте)
  return meters / 111320;
}

const pointInPolygon = (point: [number, number], polygon: [number, number][]) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > point[1]) !== (yj > point[1])) &&
      (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi + 0.0000001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const propertyTypeOptions = [
  { value: 'apartment', label: 'Квартира' },
  { value: 'house', label: 'Дом' },
  { value: 'commercial', label: 'Коммерция' },
  { value: 'land', label: 'Участок' },
];
const statusOptions = [
  { value: 'for_sale', label: 'В продаже' },
  { value: 'in_deal', label: 'На задатке' },
  { value: 'reserved', label: 'На брони' },
  { value: 'sold', label: 'Продан' },
];
const materialOptions = [
  { value: 'panel', label: 'Панель' },
  { value: 'brick', label: 'Кирпич' },
  { value: 'monolith', label: 'Монолит' },
  { value: 'block', label: 'Блок' },
  { value: 'wood', label: 'Дерево' },
];
const sortOptions = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'cheapest', label: 'Сначала дешёвые' },
  { value: 'expensive', label: 'Сначала дорогие' },
  { value: 'largest', label: 'Сначала большие' },
];

const DashboardPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isClientMode } = useClientMode();

  // Для центра карты и зума
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const mapboxRef = useRef<any>(null); // для доступа к mapRef внутри Mapbox3DMap

  // При монтировании: localStorage или дефолт
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { center: c, zoom: z } = JSON.parse(saved);
        if (Array.isArray(c) && typeof z === 'number') {
          setCenter([c[0], c[1]]);
          setZoom(z);
          return;
        }
      } catch {}
    }
    // Если нет localStorage — дефолт (Ярославль)
    setCenter(DEFAULT_CENTER);
    setZoom(DEFAULT_ZOOM);
  }, []);

  // Параллельно определяем город по IP и делаем flyTo, если localStorage не было
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return; // если был localStorage — ничего не делаем
    fetch('https://ip-api.com/json/?fields=lat,lon,status')
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success' && typeof data.lat === 'number' && typeof data.lon === 'number') {
          // flyTo на город по IP
          if (mapboxRef.current && mapboxRef.current.flyTo) {
            mapboxRef.current.flyTo({ center: [data.lon, data.lat], zoom: 11, speed: 1.2 });
          }
        }
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    getRecentProperties()
      .then((data) => {
        if (Array.isArray(data)) {
          setProperties(data);
        } else if (data && typeof data === 'object' && Array.isArray((data as any).properties)) {
          setProperties((data as any).properties);
        } else {
          setProperties([]);
        }
      })
      .catch(() => setError('Ошибка загрузки объектов'))
      .finally(() => setLoading(false));
  }, []);

  const [freehandMode, setFreehandMode] = useState(false);
  const [polygonCoords, setPolygonCoords] = useState<[number, number][]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // --- состояние фильтров ---
  const [filters, setFilters] = useState<any>({});
  const updateFilters = (patch: any) => setFilters((prev: any) => ({ ...prev, ...patch }));
  const resetFilters = () => setFilters({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Фильтрация по freehand-полигону с tolerance
  let filteredProperties = properties;
  if (polygonCoords.length > 2) {
    const tolerance = getToleranceByZoom(zoom);
    const toleranceDeg = metersToDegrees(tolerance);
    filteredProperties = filteredProperties.filter(p => {
      if (typeof p.lat !== 'number' || typeof p.lng !== 'number') return false;
      // 1. Если точка внутри полигона — включаем
      if (pointInPolygon([p.lng, p.lat], polygonCoords)) return true;
      // 2. Проверяем точки по окружности вокруг объекта
      const N = 8; // количество точек по окружности
      for (let i = 0; i < N; i++) {
        const angle = (2 * Math.PI * i) / N;
        const dx = Math.cos(angle) * toleranceDeg;
        const dy = Math.sin(angle) * toleranceDeg;
        const testLng = p.lng + dx;
        const testLat = p.lat + dy;
        if (pointInPolygon([testLng, testLat], polygonCoords)) return true;
      }
      return false;
    });
  }

  const navigate = useNavigate();
  const [addToSelectionId, setAddToSelectionId] = useState<number | null>(null);
  const [phoneModal, setPhoneModal] = useState<{ open: boolean; agent?: any }>({ open: false });

  // Добавить стили для анимаций кнопок
  const animatedBtnStyle = {
    transition: 'transform 0.13s cubic-bezier(.4,2,.6,1), box-shadow 0.13s',
    boxShadow: '0 1px 4px rgba(37,99,235,0.08)',
  };
  const animatedBtnHover = {
    transform: 'scale(1.12)',
    boxShadow: '0 2px 8px rgba(37,99,235,0.16)',
  };
  const animatedBtnActive = {
    transform: 'scale(0.93)',
  };

  return (
    <div style={{ 
      display: 'flex',
      height: 'calc(100vh - 64px)',
      background: '#f7fafd',
      padding: 0,
      margin: 0,
      overflow: 'hidden',
    }}>
      {/* Карта */}
      <div style={{
        flex: 1,
        minWidth: 0,
        height: '100%',
        background: '#f7fafd',
            position: 'relative',
      }}>
        <Popover
          content={
            <div style={{ minWidth: 320, maxWidth: 420 }}>
              <Input
                prefix={<SearchOutlined style={{ color: '#b0b6c3' }} />}
                placeholder="Поиск (адрес, название, агент, описание)"
                value={filters.search || ''}
                onChange={e => updateFilters({ search: e.target.value })}
                style={{ width: '100%', borderRadius: 14, background: 'rgba(247,249,252,0.9)', border: '1.5px solid #e6eaf1', fontWeight: 500, marginBottom: 10 }}
                allowClear
              />
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <InputNumber
                  prefix={<HomeOutlined style={{ color: '#b0b6c3' }} />}
                  placeholder="Цена от"
                  min={0}
                  value={filters.minPrice}
                  onChange={value => updateFilters({ minPrice: value === null ? undefined : value })}
                  style={{ width: 100, borderRadius: 14, background: 'rgba(247,249,252,0.9)', border: '1.5px solid #e6eaf1' }}
                />
                <InputNumber
                  placeholder="до"
                  min={0}
                  value={filters.maxPrice}
                  onChange={value => updateFilters({ maxPrice: value === null ? undefined : value })}
                  style={{ width: 100, borderRadius: 14, background: 'rgba(247,249,252,0.9)', border: '1.5px solid #e6eaf1' }}
                />
                <InputNumber
                  prefix={<ExpandOutlined style={{ color: '#b0b6c3' }} />}
                  placeholder="Площадь от"
                  min={0}
                  value={filters.minArea}
                  onChange={value => updateFilters({ minArea: value === null ? undefined : value })}
                  style={{ width: 90, borderRadius: 14, background: 'rgba(247,249,252,0.9)', border: '1.5px solid #e6eaf1' }}
                />
                <InputNumber
                  placeholder="до"
                  min={0}
                  value={filters.maxArea}
                  onChange={value => updateFilters({ maxArea: value === null ? undefined : value })}
                  style={{ width: 90, borderRadius: 14, background: 'rgba(247,249,252,0.9)', border: '1.5px solid #e6eaf1' }}
                />
                <InputNumber
                  prefix={<NumberOutlined style={{ color: '#b0b6c3' }} />}
                  placeholder="Комнат"
                  min={1}
                  max={10}
                  value={filters.rooms}
                  onChange={value => updateFilters({ rooms: value === null ? undefined : value })}
                  style={{ width: 70, borderRadius: 14, background: 'rgba(247,249,252,0.9)', border: '1.5px solid #e6eaf1' }}
                />
            </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <Select
                  placeholder="Тип"
                  allowClear
                  value={filters.type}
                  onChange={value => updateFilters({ type: value })}
                  options={propertyTypeOptions}
                  style={{ width: 120, borderRadius: 14, background: 'rgba(247,249,252,0.9)', border: '1.5px solid #e6eaf1' }}
                />
                <Select
                  placeholder="Статус"
                  allowClear
                  value={filters.status}
                  onChange={value => updateFilters({ status: value })}
                  options={statusOptions}
                  style={{ width: 120, borderRadius: 14, background: 'rgba(247,249,252,0.9)', border: '1.5px solid #e6eaf1' }}
                />
                <Select
                  placeholder="Сортировка"
                  allowClear
                  value={filters.sort}
                  onChange={value => updateFilters({ sort: value })}
                  options={sortOptions}
                  style={{ width: 140, borderRadius: 14, background: 'rgba(247,249,252,0.9)', border: '1.5px solid #e6eaf1' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <Button icon={showAdvanced ? <UpOutlined /> : <DownOutlined />} shape="circle" onClick={() => setShowAdvanced(v => !v)} style={{ background: '#f3f6fa', border: '1.5px solid #e0e7ef' }} />
                <Button icon={<ReloadOutlined />} onClick={resetFilters} style={{ borderRadius: 14, fontWeight: 500, height: 38, background: '#f3f6fa', border: '1.5px solid #e0e7ef' }}>Сбросить</Button>
                <Button
                  type={freehandMode ? 'primary' : 'default'}
                  icon={<PictureOutlined />}
                  style={{ fontWeight: 600, fontSize: 16, borderRadius: 8, flex: 1 }}
                  onClick={() => {
                    setShowFilters(false);
                    setTimeout(() => setFreehandMode(true), 100);
                  }}
                >
                  Нарисовать область на карте
                </Button>
                {polygonCoords.length > 2 && (
                  <Button danger style={{ flex: 1 }} onClick={() => setPolygonCoords([])}>
                    Сбросить область
                  </Button>
            )}
          </div>
              {showAdvanced && (
                <div style={{ width: '100%', marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', background: 'rgba(255,255,255,0.35)', borderRadius: 12, padding: 12, boxShadow: '0 2px 12px #e0e7ef' }}>
                  <InputNumber
                    prefix={<CalendarOutlined style={{ color: '#b0b6c3' }} />}
                    placeholder="Год постр. от"
                    min={1900}
                    max={2100}
                    value={filters.minYear}
                    onChange={value => updateFilters({ minYear: value === null ? undefined : value })}
                    style={{ width: 100, borderRadius: 12, background: '#f7f9fc', border: '1.5px solid #e6eaf1' }}
                  />
                  <InputNumber
                    placeholder="до"
                    min={1900}
                    max={2100}
                    value={filters.maxYear}
                    onChange={value => updateFilters({ maxYear: value === null ? undefined : value })}
                    style={{ width: 80, borderRadius: 12, background: '#f7f9fc', border: '1.5px solid #e6eaf1' }}
                  />
                  <InputNumber
                    prefix={<BuildOutlined style={{ color: '#b0b6c3' }} />}
                    placeholder="Этаж от"
                    min={1}
                    value={filters.minFloor}
                    onChange={value => updateFilters({ minFloor: value === null ? undefined : value })}
                    style={{ width: 80, borderRadius: 12, background: '#f7f9fc', border: '1.5px solid #e6eaf1' }}
                  />
                  <InputNumber
                    placeholder="до"
                    min={1}
                    value={filters.maxFloor}
                    onChange={value => updateFilters({ maxFloor: value === null ? undefined : value })}
                    style={{ width: 80, borderRadius: 12, background: '#f7f9fc', border: '1.5px solid #e6eaf1' }}
                  />
                  <InputNumber
                    prefix={<ApartmentOutlined style={{ color: '#b0b6c3' }} />}
                    placeholder="Этажей в доме от"
                    min={1}
                    value={filters.minFloors}
                    onChange={value => updateFilters({ minFloors: value === null ? undefined : value })}
                    style={{ width: 80, borderRadius: 12, background: '#f7f9fc', border: '1.5px solid #e6eaf1' }}
                  />
                  <InputNumber
                    placeholder="до"
                    min={1}
                    value={filters.maxFloors}
                    onChange={value => updateFilters({ maxFloors: value === null ? undefined : value })}
                    style={{ width: 80, borderRadius: 12, background: '#f7f9fc', border: '1.5px solid #e6eaf1' }}
                  />
                  <Select
                    placeholder="Материал"
                    allowClear
                    value={filters.material}
                    onChange={value => updateFilters({ material: value })}
                    options={materialOptions}
                    style={{ width: 120, borderRadius: 12, background: '#f7f9fc', border: '1.5px solid #e6eaf1' }}
                  />
                  <Checkbox checked={!!filters.balcony} onChange={e => updateFilters({ balcony: e.target.checked })}>Балкон</Checkbox>
                  <Checkbox checked={!!filters.lift} onChange={e => updateFilters({ lift: e.target.checked })}>Лифт</Checkbox>
                  <Checkbox checked={!!filters.parking} onChange={e => updateFilters({ parking: e.target.checked })}>
                    <CarOutlined style={{ marginRight: 4 }} />Парковка
                  </Checkbox>
                  <Checkbox checked={!!filters.furniture} onChange={e => updateFilters({ furniture: e.target.checked })}>Мебель</Checkbox>
                  <Checkbox checked={!!filters.tech} onChange={e => updateFilters({ tech: e.target.checked })}>Техника</Checkbox>
                  <Checkbox checked={!!filters.onlyWithPhoto} onChange={e => updateFilters({ onlyWithPhoto: e.target.checked })}>
                    <PictureIcon style={{ marginRight: 4 }} />Только с фото
                  </Checkbox>
                  <Checkbox checked={!!filters.isNew} onChange={e => updateFilters({ isNew: e.target.checked })}>Новостройка</Checkbox>
                  <Checkbox checked={!!filters.isSecondary} onChange={e => updateFilters({ isSecondary: e.target.checked })}>Вторичка</Checkbox>
        </div>
              )}
            </div>
          }
          title="Фильтры и рисование"
          trigger="click"
          open={showFilters}
          onOpenChange={setShowFilters}
        >
          <Button icon={<FilterOutlined />} size="large" style={{ fontWeight: 600, fontSize: 18, height: 48, borderRadius: 12, position: 'absolute', top: 18, right: 18, zIndex: 20 }}>
            Фильтры и рисование
          </Button>
        </Popover>
        <Mapbox3DMap
          mapRef={mapboxRef}
          properties={properties}
          selectedId={selectedPropertyId}
          onSelect={setSelectedPropertyId}
          initialCenter={center}
          initialZoom={zoom}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 0
          }}
          freehandMode={freehandMode}
          onPolygonDraw={coords => {
            setPolygonCoords(coords);
            setFreehandMode(false);
          }}
          polygonCoords={polygonCoords}
        />
            </div>
      {/* Боковая панель с объектами справа */}
            <div style={{
        width: 420,
        minWidth: 420,
        maxWidth: 420,
        height: '100%',
        background: '#f9fbfd',
        borderLeft: '1.5px solid #e5e7eb',
        padding: '24px 20px 24px 20px',
        overflowY: 'auto',
        flexShrink: 0,
      }}>
        <div style={{ fontWeight: 700, fontSize: 26, marginBottom: 18, color: '#222', letterSpacing: -0.5 }}>Список объектов</div>
        {loading && <div style={{ color: '#888', margin: '24px 0' }}>Загрузка...</div>}
        {error && <div style={{ color: '#e53e3e', margin: '24px 0' }}>{error}</div>}
        {!loading && !error && filteredProperties.length === 0 && <div style={{ color: '#888', margin: '24px 0' }}>Нет объектов для отображения</div>}
        {filteredProperties.map((p) => {
          const statusMap: Record<string, { label: string; color: string }> = {
            for_sale: { label: 'В продаже', color: 'green' },
            in_deal: { label: 'На задатке', color: 'orange' },
            reserved: { label: 'На брони', color: 'blue' },
            sold: { label: 'Продан', color: 'red' },
          };
          const status = statusMap[p.status as string] || { label: String(p.status), color: 'gray' };
          const legalStatus = p.legalCheck?.status || 'Не проверен';
          let legalIcon = <PropertySafetyOutlined style={{ fontSize: 18, color: '#faad14' }} />;
          let legalColor = '#faad14';
          let legalText = 'Не проверен';
          if (legalStatus === 'Проверен') {
            legalIcon = <PropertySafetyOutlined style={{ fontSize: 18, color: '#52c41a' }} />;
            legalColor = '#52c41a';
            legalText = 'Проверен';
          } else if (legalStatus === 'На проверке') {
            legalIcon = <SyncOutlined spin style={{ fontSize: 18, color: '#1890ff' }} />;
            legalColor = '#1890ff';
            legalText = 'На проверке';
          }
          // Форматирование цены с обычными пробелами
          const formatPrice = (price?: number) => price ? price.toLocaleString('ru-RU').replace(/\u00A0/g, ' ').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ') + ' руб' : '';
          return (
            <div
              key={p.id}
              style={{
                background: selectedPropertyId === p.id ? '#eaf2ff' : '#fff',
                border: selectedPropertyId === p.id ? '2px solid #2563eb' : '2px solid #e5e7eb',
                borderRadius: 14,
                padding: 16,
                marginBottom: 16,
                cursor: 'pointer',
                boxShadow: selectedPropertyId === p.id ? '0 2px 12px rgba(37,99,235,0.08)' : '0 1px 4px rgba(0,0,0,0.03)',
                transition: 'all 0.18s',
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
                position: 'relative',
                minHeight: 120,
              }}
              onClick={() => setSelectedPropertyId(p.id)}
            >
              {/* Фото */}
              <div style={{ width: 56, height: 56, borderRadius: 10, background: '#f3f6fa', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {Array.isArray(p.photos) && p.photos.length > 0 ? (
                  <img src={p.photos[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: '#b0b8c9', fontSize: 13 }}>No photo</div>
                )}
              </div>
              {/* Контент */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <Tag color="purple" style={{ fontWeight: 600, fontSize: 12 }}>Эксклюзивный объект</Tag>
                  <Tag color={status.color} style={{ fontWeight: 600, fontSize: 12 }}>{status.label}</Tag>
                </div>
                <div style={{ fontWeight: 600, fontSize: 16, color: '#222', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                <div style={{ color: '#64748b', fontSize: 13, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.address}</div>
                {/* Юридический статус */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '8px 0 2px 0' }}>
                  {legalIcon}
                  <span style={{ color: legalColor, fontWeight: 600, fontSize: 12 }}>{legalText}</span>
                </div>
                {/* Агент и агентство */}
                {!isClientMode && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    {p.agent?.photo && <Avatar src={p.agent.photo} size={28} />}
                    <span style={{ fontSize: 13, color: '#222', fontWeight: 500 }}>{p.agent?.firstName} {p.agent?.lastName}</span>
                    {p.agent?.agency?.name && <span style={{ fontSize: 12, color: '#888', marginLeft: 6 }}>({p.agent.agency.name})</span>}
                  </div>
                )}
                <div style={{ color: '#222', fontWeight: 500, fontSize: 17, margin: '2px 0 2px 0' }}>{formatPrice(p.price)}</div>
                {/* Кнопки */}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <Button
                    shape="circle"
                    icon={<InfoCircleOutlined />}
                    size="middle"
                    style={{
                      background: '#f3f6fa',
                      color: '#2563eb',
                      border: '1.5px solid #dbeafe',
                      ...animatedBtnStyle,
                      marginLeft: 0,
                    }}
                    onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.transform = 'scale(1.12)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.16)';
                    }}
                    onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 1px 4px rgba(37,99,235,0.08)';
                    }}
                    onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.transform = 'scale(0.93)';
                      e.currentTarget.style.boxShadow = '0 1px 4px rgba(37,99,235,0.08)';
                    }}
                    onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.transform = 'scale(1.12)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.16)';
                    }}
                    onClick={e => { e.stopPropagation(); navigate(`/properties/${p.id}`); }}
                  />
                  <Button
                    shape="circle"
                    icon={<PlusOutlined />}
                    size="middle"
                    style={{
                      background: '#f3f6fa',
                      color: '#2563eb',
                      border: '1.5px solid #dbeafe',
                      ...animatedBtnStyle,
                    }}
                    onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.transform = 'scale(1.12)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.16)';
                    }}
                    onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 1px 4px rgba(37,99,235,0.08)';
                    }}
                    onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.transform = 'scale(0.93)';
                      e.currentTarget.style.boxShadow = '0 1px 4px rgba(37,99,235,0.08)';
                    }}
                    onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.transform = 'scale(1.12)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.16)';
                    }}
                    onClick={e => { e.stopPropagation(); setAddToSelectionId(p.id); }}
                  />
                  {!isClientMode && p.agent?.phone && (
                    <Button
                      shape="circle"
                      icon={<PhoneOutlined />}
                      size="middle"
                      style={{
                        background: '#f3f6fa',
                        color: '#22c55e',
                        border: '1.5px solid #bbf7d0',
                        ...animatedBtnStyle,
                      }}
                      onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.transform = 'scale(1.12)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.16)';
                      }}
                      onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 1px 4px rgba(37,99,235,0.08)';
                      }}
                      onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.transform = 'scale(0.93)';
                        e.currentTarget.style.boxShadow = '0 1px 4px rgba(37,99,235,0.08)';
                      }}
                      onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.transform = 'scale(1.12)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.16)';
                      }}
                      onClick={e => { e.stopPropagation(); setPhoneModal({ open: true, agent: p.agent }); }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {/* Модалка добавить в подбор */}
        <AddToSelectionModal open={!!addToSelectionId} propertyId={addToSelectionId || undefined} onClose={() => setAddToSelectionId(null)} />
        {/* Модалка позвонить */}
        {!isClientMode && (
          <Modal open={phoneModal.open} onCancel={() => setPhoneModal({ open: false })} footer={null} title="Контакт агента" destroyOnClose>
            {phoneModal.agent && (
              <Space direction="vertical" size={8}>
                <Avatar src={phoneModal.agent.photo} size={48} />
                <Typography.Text strong>{phoneModal.agent.firstName} {phoneModal.agent.lastName}</Typography.Text>
                <Typography.Text type="secondary">{phoneModal.agent.phone}</Typography.Text>
              </Space>
            )}
          </Modal>
        )}
      </div>
    </div>
  );
};

export default DashboardPage; 