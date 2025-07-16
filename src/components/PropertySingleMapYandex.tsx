import React, { useEffect, useRef } from 'react';

interface PropertySingleMapYandexProps {
  lat: number;
  lng: number;
  address?: string;
  style?: React.CSSProperties;
}

const DEFAULT_ZOOM = 16;

const PropertySingleMapYandex: React.FC<PropertySingleMapYandexProps> = ({ lat, lng, address, style }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;
    const initMap = () => {
      mapRef.current = new window.ymaps.Map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: DEFAULT_ZOOM,
        controls: ['zoomControl', 'fullscreenControl'],
      });
      markerRef.current = new window.ymaps.Placemark([lat, lng], {
        balloonContent: address || '',
      }, {
        preset: 'islands#blueIcon',
        iconColor: '#3388ff',
      });
      mapRef.current.geoObjects.add(markerRef.current);
    };
    if (window.ymaps && window.ymaps.Map) {
      initMap();
    } else {
      window.ymaps.ready(initMap);
    }
    // Очистка
    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [lat, lng, address]);

  return <div ref={mapContainerRef} style={style || { width: '100%', height: 400, borderRadius: 22, overflow: 'hidden', boxShadow: '0 8px 32px #e6eaf1', background: '#fff' }} />;
};

export default PropertySingleMapYandex; 