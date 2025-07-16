import React, { useEffect, useRef } from 'react';
import { Property } from '../types';

// Декларация для window.mapgl
declare global {
  interface Window {
    mapgl: any;
  }
}

const DGIS_API_KEY = process.env.REACT_APP_2GIS_API_KEY || 'demo'; // замените на ваш ключ

interface UniversalMap2GISProps {
  properties: Property[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  style?: React.CSSProperties;
}

const DEFAULT_CENTER: [number, number] = [55.751244, 37.618423];
const DEFAULT_ZOOM = 11;

const UniversalMap2GIS: React.FC<UniversalMap2GISProps> = ({
  properties,
  selectedId,
  onSelect,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  style = { height: 400, width: '100%' },
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return; // уже инициализировано
    mapRef.current = new window.mapgl.Map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      key: DGIS_API_KEY,
      style: 'c8b0',
    });
  }, [initialCenter, initialZoom]);

  // Обновление маркеров
  useEffect(() => {
    if (!mapRef.current) return;
    // Удаляем старые маркеры
    markersRef.current.forEach(m => m.destroy());
    markersRef.current = [];
    // Добавляем новые маркеры (без кластеризации)
    properties.filter(p => !isNaN(Number(p.lat)) && !isNaN(Number(p.lng))).forEach(p => {
      // Получаем фото объекта
      let photo = Array.isArray(p.photos) && p.photos.length > 0 ? p.photos[0] : (typeof p.photos === 'string' && p.photos ? JSON.parse(p.photos)[0] : null);
      if (!photo) photo = '/placeholder-property.jpg';
      // Формируем label с фото и выделением
      const isSelected = selectedId === p.id;
      const labelHtml = `
        <div style='width:160px;text-align:left;'>
          <img src='${photo}' alt='Фото' style='width:100%;height:70px;object-fit:cover;border-radius:7px;margin-bottom:4px;${isSelected ? 'border:2px solid #ff3333;' : ''}' onerror="this.src='/placeholder-property.jpg'" loading='lazy' />
          <b>${p.title}</b><br/>
          ${p.address}<br/>
          <a href='/properties/${p.id}'>Подробнее</a>
        </div>
      `;
      const marker = new window.mapgl.Marker(mapRef.current, {
        coordinates: [Number(p.lng), Number(p.lat)],
        onClick: () => onSelect && onSelect(p.id),
        label: { html: labelHtml },
        icon: isSelected ? '/assets/marker-icon-selected.png' : undefined, // если поддерживается кастомная иконка
      });
      markersRef.current.push(marker);
    });
  }, [properties, onSelect, selectedId]);

  // Центрирование на выбранном объекте
  useEffect(() => {
    if (!mapRef.current || !selectedId) return;
    const selected = properties.find(p => p.id === selectedId && !isNaN(Number(p.lat)) && !isNaN(Number(p.lng)));
    if (selected) {
      mapRef.current.setCenter([Number(selected.lng), Number(selected.lat)]);
    }
  }, [selectedId, properties]);

  return (
    <div ref={mapContainerRef} style={style} />
  );
};

export default UniversalMap2GIS; 