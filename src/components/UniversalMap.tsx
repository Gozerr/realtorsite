import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L, { Map as LeafletMap, LeafletEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MarkerClusterGroup } from 'leaflet.markercluster';
import { Property } from '../types';

// Кастомный маркер (иконка)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Кастомные иконки для обычного и выбранного маркера
const defaultIcon = new L.Icon({
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
const selectedIcon = new L.Icon({
  iconUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -38],
  shadowSize: [48, 48],
});

interface UniversalMapProps {
  properties: Property[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  style?: React.CSSProperties;
}

const DEFAULT_CENTER: [number, number] = [55.751244, 37.618423];
const DEFAULT_ZOOM = 11;

function MapEvents({ onBoundsChange }: { onBoundsChange?: (bounds: L.LatLngBounds) => void }) {
  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      const bounds = map.getBounds();
      onBoundsChange && onBoundsChange(bounds);
    },
    zoomend: (e) => {
      const map = e.target;
      const bounds = map.getBounds();
      onBoundsChange && onBoundsChange(bounds);
    },
  });
  return null;
}

export const UniversalMap: React.FC<UniversalMapProps> = ({
  properties,
  selectedId,
  onSelect,
  onBoundsChange,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  style = { height: 400, width: '100%' },
}) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<MarkerClusterGroup | null>(null);

  // Центрируем карту на выбранном объекте
  useEffect(() => {
    if (selectedId && mapRef.current) {
      const selected = properties.find(p => p.id === selectedId && typeof p.lat === 'number' && typeof p.lng === 'number');
      if (selected) {
        mapRef.current.setView([selected.lat as number, selected.lng as number], mapRef.current.getZoom(), { animate: true });
      }
    }
  }, [selectedId, properties]);

  // Кластеризация маркеров
  useEffect(() => {
    if (!mapRef.current) return;
    const markerLayer = markerLayerRef.current;
    if (markerLayer) {
      markerLayer.clearLayers?.();
      if (mapRef.current.hasLayer(markerLayer)) {
        mapRef.current.removeLayer(markerLayer);
      }
    }
    markerLayerRef.current = new MarkerClusterGroup();
    properties.filter(p => typeof p.lat === 'number' && typeof p.lng === 'number').forEach(p => {
      // Получаем фото объекта
      let photo = Array.isArray(p.photos) && p.photos.length > 0 ? p.photos[0] : (typeof p.photos === 'string' && p.photos ? JSON.parse(p.photos)[0] : null);
      if (!photo) photo = '/placeholder-property.jpg';
      // Формируем popup с фото
      const popupHtml = `
        <div style='width:180px'>
          <img src='${photo}' alt='Фото' style='width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:6px;' onerror="this.src='/placeholder-property.jpg'" loading='lazy' />
          <b>${p.title}</b><br/>
          ${p.address}<br/>
          <a href='/properties/${p.id}'>Подробнее</a>
        </div>
      `;
      // Выбираем иконку
      const icon = selectedId === p.id ? selectedIcon : defaultIcon;
      const marker = L.marker([p.lat as number, p.lng as number], { icon });
      marker.on('click', () => onSelect && onSelect(p.id));
      marker.bindPopup(popupHtml);
      markerLayerRef.current!.addLayer(marker);
    });
    const newLayer = markerLayerRef.current;
    if (newLayer) {
      newLayer.addTo(mapRef.current);
    }
  }, [properties, onSelect, selectedId]);

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      style={style}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEvents onBoundsChange={onBoundsChange} />
    </MapContainer>
  );
};

export default UniversalMap; 