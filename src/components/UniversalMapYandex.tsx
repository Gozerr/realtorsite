import React, { useEffect, useRef } from 'react';
import { Property } from '../types';

// Декларация для window.ymaps
declare global {
  interface Window {
    ymaps: any;
  }
}

interface UniversalMapYandexProps {
  properties: Property[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  style?: React.CSSProperties;
  onBoundsChange?: (bounds: any) => void;
}

const DEFAULT_CENTER: [number, number] = [55.751244, 37.618423];
const DEFAULT_ZOOM = 11;

const UniversalMapYandex: React.FC<UniversalMapYandexProps> = ({
  properties,
  selectedId,
  onSelect,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  style = { height: 400, width: '100%' },
  onBoundsChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const skipNextBoundsChange = useRef(false);

  // Инициализация карты
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;
    const initMap = () => {
      mapRef.current = new window.ymaps.Map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        controls: ['zoomControl', 'fullscreenControl'],
      });
      if (onBoundsChange) {
        mapRef.current.events.add('boundschange', () => {
          if (skipNextBoundsChange.current) {
            skipNextBoundsChange.current = false;
            return;
          }
          const bounds = mapRef.current.getBounds();
          if (bounds && bounds[0] && bounds[1]) {
            const [sw, ne] = bounds;
            onBoundsChange([sw[1], sw[0], ne[1], ne[0]]);
          }
        });
      }
    };
    if (window.ymaps && window.ymaps.Map) {
      initMap();
    } else {
      window.ymaps.ready(initMap);
    }
  }, [initialCenter, initialZoom, onBoundsChange]);

  // Обновление маркеров и кластеров
  useEffect(() => {
    if (!mapRef.current || !window.ymaps) return;
    // Удаляем старые маркеры и кластеры
    if (clustererRef.current) {
      mapRef.current.geoObjects.remove(clustererRef.current);
      clustererRef.current = null;
    }
    markersRef.current = [];
    // Создаём новые маркеры
    const geoObjects = properties.filter(p => !isNaN(Number(p.lat)) && !isNaN(Number(p.lng))).map(p => {
      // Получаем фото объекта
      let photo = Array.isArray(p.photos) && p.photos.length > 0 ? p.photos[0] : (typeof p.photos === 'string' && p.photos ? JSON.parse(p.photos)[0] : null);
      if (!photo) photo = '/placeholder-property.jpg';
      // Формируем balloonContent с фото
      const balloonHtml = `
        <div style='width:180px'>
          <img src='${photo}' alt='Фото' style='width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:6px;' onerror="this.src='/placeholder-property.jpg'" loading='lazy' />
          <b>${p.title}</b><br/>
          ${p.address}<br/>
          <a href='/properties/${p.id}'>Подробнее</a>
        </div>
      `;
      const placemark = new window.ymaps.Placemark([Number(p.lat), Number(p.lng)], {
        balloonContent: balloonHtml
      }, {
        preset: selectedId === p.id ? 'islands#redIcon' : 'islands#blueIcon',
        iconColor: selectedId === p.id ? '#ff3333' : '#3388ff',
      });
      placemark.events.add('click', () => {
        skipNextBoundsChange.current = true;
        onSelect && onSelect(p.id);
      });
      markersRef.current.push(placemark);
      return placemark;
    });
    // Кластеризация
    clustererRef.current = new window.ymaps.Clusterer({
      preset: 'islands#invertedBlueClusterIcons',
      groupByCoordinates: false,
      clusterDisableClickZoom: false,
    });
    clustererRef.current.add(geoObjects);
    mapRef.current.geoObjects.add(clustererRef.current);
  }, [properties, selectedId, onSelect]);

  // Плавная анимация выделения маркера (смена preset)
  useEffect(() => {
    if (!window.ymaps || !markersRef.current.length) return;
    markersRef.current.forEach(placemark => {
      const id = placemark.properties.get('balloonContent').match(/properties\/(\d+)/)?.[1];
      if (!id) return;
      if (Number(id) === selectedId) {
        placemark.options.set('preset', 'islands#redIcon');
        placemark.options.set('iconColor', '#ff3333');
      } else {
        placemark.options.set('preset', 'islands#blueIcon');
        placemark.options.set('iconColor', '#3388ff');
      }
    });
  }, [selectedId]);

  // Центрирование на выбранном объекте
  useEffect(() => {
    if (!mapRef.current || !selectedId) return;
    const selected = properties.find(p => p.id === selectedId && !isNaN(Number(p.lat)) && !isNaN(Number(p.lng)));
    if (selected) {
      mapRef.current.setCenter([Number(selected.lat), Number(selected.lng)], mapRef.current.getZoom(), { duration: 300 });
    }
  }, [selectedId, properties]);

  // Центрирование карты при изменении initialCenter
  useEffect(() => {
    if (mapRef.current && initialCenter) {
      mapRef.current.setCenter(initialCenter, mapRef.current.getZoom(), { duration: 300 });
    }
  }, [initialCenter]);

  return (
    <div ref={mapContainerRef} style={style} />
  );
};

export default UniversalMapYandex; 