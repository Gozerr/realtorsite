import React from 'react';
import { Row, Col, Input, InputNumber, Select, Button, Typography, Spin, Alert, Tabs, Divider, Space, Checkbox, Collapse, Badge, Tooltip } from 'antd';
import { SearchOutlined, HomeOutlined, NumberOutlined, ExpandOutlined, EnvironmentOutlined, ApartmentOutlined, CarOutlined, BuildOutlined, CalendarOutlined, PictureOutlined, DownOutlined, UpOutlined, FilterOutlined, ReloadOutlined, CheckCircleTwoTone } from '@ant-design/icons';
import PropertyCard from '../components/PropertyCard';
import UniversalMapYandex from '../components/UniversalMapYandex';
import { useNavigate } from 'react-router-dom';
import { usePropertiesContext } from '../context/PropertiesContext';
import { AuthContext } from '../context/AuthContext';
import { Property, PropertyStatus } from '../types';

const { Title } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

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

export default function PropertiesPage() {
  const auth = React.useContext(AuthContext);
  const navigate = useNavigate();
  const {
    filters,
    updateFilters,
    resetFilters,
    properties,
    setProperties,
    loading,
    selectedId,
    setSelectedId,
    bbox,
    setBbox,
    center,
    setCenter
  } = usePropertiesContext();
  const [activeTab, setActiveTab] = React.useState<'active' | 'archive' | 'my'>('active');
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [foundCount, setFoundCount] = React.useState(0);

  // Новый фильтр: фильтрация по всем параметрам (search, price, area, rooms, type, status)
  let filteredProperties = properties
    .filter(p => !!p.id && typeof p.id === 'number')
    .filter(p => {
      const status = (p.status || '').toString().toLowerCase();
      if (activeTab === 'my') {
        if (auth?.user?.role === 'agent') {
          return p.agent?.id === auth.user.id || p.agentId === auth.user.id;
        } else if (auth?.user?.role === 'director') {
          if (auth.user.agencyId) {
            return (p.agent && p.agent.agency && p.agent.agency.id === auth.user.agencyId);
          }
          return true;
        }
      }
      return activeTab === 'active' ? status !== 'sold' : status === 'sold';
    })
    .filter(p => {
      if (!filters.search) return true;
      const search = filters.search.toLowerCase();
      return (
        (p.title && p.title.toLowerCase().includes(search)) ||
        (p.address && p.address.toLowerCase().includes(search)) ||
        (p.description && p.description.toLowerCase().includes(search)) ||
        (p.agent && ((p.agent.firstName && p.agent.firstName.toLowerCase().includes(search)) || (p.agent.lastName && p.agent.lastName.toLowerCase().includes(search)) || (p.agent.email && p.agent.email.toLowerCase().includes(search)))) ||
        (p.price && String(p.price).includes(search)) ||
        (p.area && String(p.area).includes(search)) ||
        (p.status && p.status.toLowerCase().includes(search))
      );
    })
    .filter(p => {
      if (filters.minPrice !== undefined && p.price < filters.minPrice) return false;
      if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false;
      if (filters.minArea !== undefined && (p.area === undefined || p.area < filters.minArea)) return false;
      if (filters.maxArea !== undefined && (p.area === undefined || p.area > filters.maxArea)) return false;
      if (filters.rooms !== undefined && p.rooms !== filters.rooms) return false;
      if (filters.type && p.type !== filters.type) return false;
      if (filters.status && p.status !== filters.status) return false;
      return true;
    });

  // Фильтрация по bbox (видимая область карты)
  if (bbox && Array.isArray(bbox) && bbox.length === 4) {
    filteredProperties = filteredProperties.filter(p => {
      if (typeof p.lat !== 'number' || typeof p.lng !== 'number') return false;
      const [minLng, minLat, maxLng, maxLat] = bbox;
      return p.lat >= minLat && p.lat <= maxLat && p.lng >= minLng && p.lng <= maxLng;
    });
  }

  // Открыть большую карту с текущими фильтрами
  const handleOpenBigMap = () => {
    const params = new URLSearchParams();
    params.set('filters', encodeURIComponent(JSON.stringify(filters)));
    if (activeTab) params.set('tab', activeTab);
    navigate(`/map?${params.toString()}`);
  };

  // Для карты: только объекты с координатами
  const propertiesWithCoords = filteredProperties.filter(p => p.lat && p.lng);

  const handleStatusChange = (id: number, status: string, updatedProperty?: Property) => {
    setProperties((prev: Property[]) => prev.map((p: Property) => p.id === id ? (updatedProperty ? updatedProperty : { ...p, status: status as PropertyStatus }) : p));
  };

  // Вместо setSelectedId для карты:
  const handleMapSelect = (id: number) => {
    navigate(`/properties/${id}`);
  };

  React.useEffect(() => {
    setFoundCount(filteredProperties.length);
  }, [filteredProperties]);

  console.log('properties:', properties);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(120deg, #f8fafc 0%, #e9f0fb 100%)', padding: '32px 0' }}>
      <div className="property-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1440, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Title level={2} className="property-title-mobile" style={{ marginBottom: 32, fontWeight: 800, letterSpacing: -1 }}>
            Объекты недвижимости
          </Title>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<EnvironmentOutlined />}
          style={{ marginLeft: 24, fontWeight: 600, fontSize: 18, height: 48, borderRadius: 12 }}
          onClick={handleOpenBigMap}
        >
          Открыть большую карту
        </Button>
      </div>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 24px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={key => setActiveTab(key as 'active' | 'archive' | 'my')}
          style={{ marginBottom: 24 }}
          items={[
            { key: 'active', label: 'Активные объекты' },
            { key: 'my', label: 'Мои объекты' },
            { key: 'archive', label: 'Архив (Продано)' },
          ]}
          data-testid="properties-tabs"
        />
        {/* Прогрессивный фильтр */}
        <div style={{
          background: 'rgba(255,255,255,0.55)',
          borderRadius: 24,
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
          backdropFilter: 'blur(12px)',
          border: '1.5px solid #e0e7ef',
          padding: 28,
          marginBottom: 36,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 18,
          position: 'relative',
          minHeight: 90,
          transition: 'box-shadow 0.3s',
        }}>
          <Badge count={foundCount} style={{ background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 15, boxShadow: '0 2px 8px #b6c6e6' }}>
            <FilterOutlined style={{ fontSize: 26, color: '#2563eb', marginRight: 10 }} />
          </Badge>
          <Input
            prefix={<SearchOutlined style={{ color: '#b0b6c3' }} />}
            placeholder="Поиск (адрес, название, агент, описание)"
            value={filters.search || ''}
            onChange={e => updateFilters({ search: e.target.value })}
            style={{ width: 220, borderRadius: 14, background: 'rgba(247,249,252,0.9)', border: '1.5px solid #e6eaf1', fontWeight: 500 }}
            allowClear
          />
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
            style={{ width: 80, borderRadius: 14, background: 'rgba(247,249,252,0.9)', border: '1.5px solid #e6eaf1' }}
          />
          <InputNumber
            prefix={<ExpandOutlined style={{ color: '#b0b6c3' }} />}
            placeholder="Площадь от"
            min={0}
            value={filters.minArea}
            onChange={value => updateFilters({ minArea: value === null ? undefined : value })}
            style={{ width: 80, borderRadius: 14, background: 'rgba(247,249,252,0.9)', border: '1.5px solid #e6eaf1' }}
          />
          <InputNumber
            placeholder="до"
            min={0}
            value={filters.maxArea}
            onChange={value => updateFilters({ maxArea: value === null ? undefined : value })}
            style={{ width: 80, borderRadius: 14, background: 'rgba(247,249,252,0.9)', border: '1.5px solid #e6eaf1' }}
          />
          <InputNumber
            prefix={<NumberOutlined style={{ color: '#b0b6c3' }} />}
            placeholder="Комнат"
            min={1}
            max={10}
            value={filters.rooms}
            onChange={value => updateFilters({ rooms: value === null ? undefined : value })}
            style={{ width: 60, borderRadius: 14, background: 'rgba(247,249,252,0.9)', border: '1.5px solid #e6eaf1' }}
          />
          <Select
            placeholder="Тип"
            allowClear
            value={filters.type}
            onChange={value => updateFilters({ type: value })}
            options={propertyTypeOptions}
            style={{ width: 110, borderRadius: 14, background: 'rgba(247,249,252,0.9)', border: '1.5px solid #e6eaf1' }}
          />
          <Select
            placeholder="Статус"
            allowClear
            value={filters.status}
            onChange={value => updateFilters({ status: value })}
            options={statusOptions}
            style={{ width: 110, borderRadius: 14, background: 'rgba(247,249,252,0.9)', border: '1.5px solid #e6eaf1' }}
          />
          <Tooltip title="Показать расширенные фильтры">
            <Button icon={showAdvanced ? <UpOutlined /> : <DownOutlined />} shape="circle" onClick={() => setShowAdvanced(v => !v)} style={{ marginLeft: 8, background: '#f3f6fa', border: '1.5px solid #e0e7ef' }} />
          </Tooltip>
          <Button icon={<ReloadOutlined />} onClick={resetFilters} style={{ borderRadius: 14, fontWeight: 500, height: 38, marginLeft: 8, background: '#f3f6fa', border: '1.5px solid #e0e7ef' }}>Сбросить</Button>
          {/* Расширенные фильтры */}
          {showAdvanced && (
            <div style={{ width: '100%', marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center', background: 'rgba(255,255,255,0.35)', borderRadius: 18, padding: 18, boxShadow: '0 2px 12px #e0e7ef' }}>
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
                <PictureOutlined style={{ marginRight: 4 }} />Только с фото
              </Checkbox>
              <Checkbox checked={!!filters.isNew} onChange={e => updateFilters({ isNew: e.target.checked })}>Новостройка</Checkbox>
              <Checkbox checked={!!filters.isSecondary} onChange={e => updateFilters({ isSecondary: e.target.checked })}>Вторичка</Checkbox>
              <Select
                placeholder="Сортировка"
                allowClear
                value={filters.sort}
                onChange={value => updateFilters({ sort: value })}
                options={sortOptions}
                style={{ width: 140, borderRadius: 12, background: '#f7f9fc', border: '1.5px solid #e6eaf1' }}
              />
            </div>
          )}
        </div>
        {/* Карта */}
        <div style={{
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 4px 24px rgba(40,60,90,0.07)',
          padding: 0,
          marginBottom: 40,
          overflow: 'hidden',
          border: '1px solid #e6eaf1'
        }}>
          <UniversalMapYandex
            properties={propertiesWithCoords}
            selectedId={selectedId}
            onSelect={setSelectedId}
            initialCenter={center}
            initialZoom={12}
            style={{ height: 350, width: '100%', borderRadius: 18 }}
            onBoundsChange={setBbox}
          />
        </div>
        {/* Список объектов */}
        <Spin spinning={loading}>
          <Row gutter={[24, 24]} style={{ margin: 0 }}>
            {filteredProperties.map(property => (
              <Col xs={24} sm={12} md={8} lg={8} key={property.id} style={{ display: 'flex' }}>
                <PropertyCard property={property} onStatusChange={handleStatusChange} />
              </Col>
            ))}
          </Row>
        </Spin>
      </div>
      {/* Анимация */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate3d(0, 40px, 0); }
          to { opacity: 1; transform: none; }
        }
        @media (max-width: 767px) {
          .property-title-mobile {
            writing-mode: initial !important;
            text-align: left !important;
            font-size: 22px !important;
            letter-spacing: 0 !important;
            margin-bottom: 16px !important;
            margin-top: 0 !important;
            font-weight: 700 !important;
            width: 100% !important;
            white-space: normal !important;
          }
          .property-header-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
            padding: 0 !important;
          }
          .property-filters {
            flex-direction: column !important;
            gap: 8px !important;
            padding: 12px !important;
            width: 100% !important;
          }
          .property-card-col {
            flex: 0 0 100% !important;
            max-width: 100% !important;
          }
        }
        @media (max-width: 991px) and (min-width: 768px) {
          .property-card-col {
            flex: 0 0 50% !important;
            max-width: 50% !important;
          }
        }
      `}</style>
    </div>
  );
}