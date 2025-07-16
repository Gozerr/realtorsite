/* eslint-disable import/first */
import React, { useEffect, useRef, MutableRefObject, useState } from 'react';
import maplibregl, { Map, LngLatLike, GeoJSONSource, MapMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Property } from '../types';

// --- Стандартный маркер MapLibre с popup ---
function StandardMarkerWithPopup({ map, lngLat, property }: {
  map: maplibregl.Map,
  lngLat: [number, number],
  property: Property
}) {
  const markerRef = useRef<maplibregl.Marker | null>(null);
  useEffect(() => {
    if (!map) return;
    const marker = new maplibregl.Marker({ anchor: 'bottom' })
      .setLngLat(lngLat)
      .addTo(map);
    const popup = new maplibregl.Popup({ offset: 24 })
      .setHTML(`
        <div style='min-width:180px'>
          ${Array.isArray(property.photos) && property.photos.length > 0
            ? `<img src='${property.photos[0]}' alt='Фото' style='width:100%;height:110px;object-fit:cover;border-radius:8px 8px 0 0;margin-bottom:6px;' />`
            : `<div style='width:100%;height:110px;background:#f3f6fa;color:#b0b8c9;display:flex;align-items:center;justify-content:center;border-radius:8px 8px 0 0;margin-bottom:6px;'>Нет фото</div>`}
          <div style='font-weight:600;font-size:16px;margin-bottom:2px;'>${property.title || 'Объект'}</div>
          <div style='color:#64748b;font-size:13px;margin-bottom:4px;'>${property.address || ''}</div>
          <div style='color:#222;font-size:18px;font-weight:400;margin-bottom:2px;'>${property.price ? Number(property.price).toLocaleString('ru-RU') + ' руб' : ''}</div>
          <a href='/properties/${property.id}'
             style='display:inline-block;margin-top:8px;padding:7px 18px;background:#2563eb;color:#fff;border-radius:7px;font-size:14px;font-weight:500;text-decoration:none;transition:background 0.18s;box-shadow:0 2px 8px rgba(37,99,235,0.08);text-align:center;'
             onmouseover="this.style.background='#1741a6'" onmouseout="this.style.background='#2563eb'">
            Подробнее
          </a>
        </div>
      `);
    marker.setPopup(popup);
    markerRef.current = marker;
    return () => {
      if (markerRef.current) markerRef.current.remove();
    };
  }, [map, lngLat, property]);
  return null;
}

interface Mapbox3DMapProps {
  properties: Property[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  style?: React.CSSProperties;
  mapRef?: MutableRefObject<maplibregl.Map | null>;
  freehandMode?: boolean;
  onPolygonDraw?: (coords: [number, number][]) => void;
  polygonCoords?: [number, number][];
}

const DEFAULT_CENTER: [number, number] = [57.6261, 39.8845]; // Ярославль
const DEFAULT_ZOOM = 12;
const STORAGE_KEY = 'mapbox_last_view';

const Mapbox3DMap: React.FC<Mapbox3DMapProps> = ({
  properties,
  selectedId,
  onSelect,
  initialCenter,
  initialZoom,
  style = { height: 500, width: '100%', borderRadius: 16 },
  mapRef,
  freehandMode = false,
  onPolygonDraw,
  polygonCoords = [],
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const internalMapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const initialCenterRef = useRef<[number, number]>(DEFAULT_CENTER);
  const initialZoomRef = useRef<number>(DEFAULT_ZOOM);
  const [drawing, setDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const [polygonId, setPolygonId] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  // Получаем стартовые значения центра/зума только один раз (оптимизировано)
  useEffect(() => {
    let usedDefault = false;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { center: c, zoom: z } = JSON.parse(saved);
        if (Array.isArray(c) && typeof z === 'number') {
          initialCenterRef.current = [c[0], c[1]];
          initialZoomRef.current = z;
          usedDefault = true;
        }
      } catch {}
    }
    if (!usedDefault) {
      initialCenterRef.current = initialCenter || DEFAULT_CENTER;
      initialZoomRef.current = initialZoom || DEFAULT_ZOOM;
      fetch('https://ip-api.com/json/?fields=lat,lon,status')
        .then(r => r.json())
        .then(data => {
          if (data.status === 'success' && typeof data.lat === 'number' && typeof data.lon === 'number') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ center: [data.lon, data.lat], zoom: 11 }));
          }
        });
    }
  }, [initialCenter, initialZoom]);

  // Карта создаётся только один раз
  useEffect(() => {
    if (!mapContainer.current || internalMapRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.stadiamaps.com/styles/osm_bright.json',
      center: initialCenterRef.current,
      zoom: initialZoomRef.current,
      pitch: 45,
      bearing: -17.6
    });
    internalMapRef.current = map;
    if (mapRef) mapRef.current = map;
    map.on('load', () => setMapReady(true));
    map.on('moveend', () => {
      const c = map.getCenter();
      const z = map.getZoom();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ center: [c.lng, c.lat], zoom: z }));
    });
    map.on('zoomend', () => {
      const c = map.getCenter();
      const z = map.getZoom();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ center: [c.lng, c.lat], zoom: z }));
    });
    return () => {
      map.remove();
      internalMapRef.current = null;
      if (mapRef) mapRef.current = null;
    };
  }, [mapRef]);

  // Перемещаем карту к выбранному маркеру при изменении selectedId
  useEffect(() => {
    if (!internalMapRef.current || !selectedId) return;
    const selected = properties.find(p => Number(p.id) === Number(selectedId));
    if (selected && typeof selected.lat === 'number' && typeof selected.lng === 'number') {
      internalMapRef.current.flyTo({ center: [selected.lng, selected.lat], zoom: internalMapRef.current.getZoom(), speed: 1.2 });
    }
  }, [selectedId, properties]);

  // --- Freehand drawing (улучшено) ---
  useEffect(() => {
    if (!internalMapRef.current) return;
    const map = internalMapRef.current;
    let isDrawing = false;
    let points: [number, number][] = [];
    let polyId = polygonId || 'drawn-polygon';
    function onMouseDown(e: MapMouseEvent) {
      if (!freehandMode) return;
      if (e.originalEvent.button !== 0) return; // Только левая кнопка мыши!
      isDrawing = true;
      points = [[e.lngLat.lng, e.lngLat.lat]];
      setDrawPoints([[e.lngLat.lng, e.lngLat.lat]]);
      setDrawing(true);
      setShowOverlay(true);
      map.getCanvas().style.cursor = 'pointer';
    }
    function onMouseMove(e: MapMouseEvent) {
      if (!freehandMode || !isDrawing) return;
      points.push([e.lngLat.lng, e.lngLat.lat]);
      setDrawPoints([...points]);
    }
    function onMouseUp(e: MapMouseEvent) {
      if (!freehandMode || !isDrawing) return;
      isDrawing = false;
      points.push([e.lngLat.lng, e.lngLat.lat]);
      setDrawPoints([...points]);
      setDrawing(false);
      setShowOverlay(false);
      setPolygonId(polyId);
      addPolygonToMap(map, points, polyId);
      map.getCanvas().style.cursor = '';
      if (onPolygonDraw) onPolygonDraw(points);
    }
    if (freehandMode) {
      map.on('mousedown', onMouseDown);
      map.on('mousemove', onMouseMove);
      map.on('mouseup', onMouseUp);
      setShowOverlay(true);
      map.getCanvas().style.cursor = 'pointer';
    }
    return () => {
      map.off('mousedown', onMouseDown);
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
      setShowOverlay(false);
      map.getCanvas().style.cursor = '';
    };
  }, [freehandMode, internalMapRef.current, onPolygonDraw, polygonId]);

  // --- Overlay-подсказка ---

  // --- Polyline отрисовка линии рисования ---
  useEffect(() => {
    if (!internalMapRef.current) return;
    const map = internalMapRef.current;
    const id = 'draw-polyline';
    if (drawPoints.length > 1 && freehandMode) {
      const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: drawPoints },
        properties: {},
      };
      if (map.getSource(id)) {
        (map.getSource(id) as GeoJSONSource).setData(geojson);
      } else {
        map.addSource(id, { type: 'geojson', data: geojson });
        map.addLayer({
          id,
          type: 'line',
          source: id,
          paint: {
            'line-color': '#2563eb',
            'line-width': 3.5,
            'line-dasharray': [2, 2],
          },
        });
      }
    } else {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    }
  }, [drawPoints, freehandMode]);

  // --- Рисование/удаление полигона по polygonCoords ---
  useEffect(() => {
    if (!internalMapRef.current) return;
    const map = internalMapRef.current;
    const polyId = 'drawn-polygon';
    const outlineId = 'drawn-polygon-outline';

    // Удаляем старые слои/источники только если область сброшена
    if (Array.isArray(polygonCoords) && polygonCoords.length <= 2) {
      if (map.getLayer(polyId)) map.removeLayer(polyId);
      if (map.getSource(polyId)) map.removeSource(polyId);
      if (map.getLayer(outlineId)) map.removeLayer(outlineId);
      if (map.getSource(outlineId)) map.removeSource(outlineId);
      return;
    }

    // Если есть координаты — обновляем или создаём source/layer
    const geojson: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[...polygonCoords, polygonCoords[0]]] },
      properties: {},
    };

    if (map.getSource(polyId)) {
      (map.getSource(polyId) as GeoJSONSource).setData(geojson);
    } else {
      map.addSource(polyId, { type: 'geojson', data: geojson });
      map.addLayer({
        id: polyId,
        type: 'fill',
        source: polyId,
        paint: {
          'fill-color': '#2563eb',
          'fill-opacity': 0.18,
        },
      });
      map.addLayer({
        id: outlineId,
        type: 'line',
        source: polyId,
        paint: {
          'line-color': '#2563eb',
          'line-width': 2.5,
        },
      });
    }
  }, [polygonCoords]);

  // --- Сброс линии при выходе из режима ---
  useEffect(() => {
    if (!internalMapRef.current) return;
    const map = internalMapRef.current;
    const id = 'draw-polyline';
    // Отключаем drag и zoom при freehandMode
    if (freehandMode) {
      map.boxZoom.disable();
      map.dragPan.disable();
      map.scrollZoom.disable();
      map.keyboard.disable();
      map.doubleClickZoom.disable();
      map.touchZoomRotate.disable();
    } else {
      map.boxZoom.enable();
      map.dragPan.enable();
      map.scrollZoom.enable();
      map.keyboard.enable();
      map.doubleClickZoom.enable();
      map.touchZoomRotate.enable();
    }
    if (!freehandMode) {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
      setDrawPoints([]);
    }
  }, [freehandMode]);

  // --- Удаление полигона при сбросе polygonCoords ---
  useEffect(() => {
    if (!internalMapRef.current) return;
    const map = internalMapRef.current;
    const polyId = 'drawn-polygon';
    const outlineId = 'drawn-polygon-outline';
    if (Array.isArray(polygonCoords) && polygonCoords.length === 0) {
      if (map.getLayer(polyId)) map.removeLayer(polyId);
      if (map.getSource(polyId)) map.removeSource(polyId);
      if (map.getLayer(outlineId)) map.removeLayer(outlineId);
      if (map.getSource(outlineId)) map.removeSource(outlineId);
    }
  }, [polygonCoords]);

  // --- Маркеры и карта ---
  return (
    <div style={style}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      {mapReady && internalMapRef.current && properties.map((p) => (
        (typeof p.lat === 'number' && typeof p.lng === 'number') && (
          <StandardMarkerWithPopup
            key={p.id}
            map={internalMapRef.current!}
            lngLat={[p.lng, p.lat]}
            property={p}
          />
        )
      ))}
    </div>
  );
};

// Функция для добавления geojson-полигона на карту
function addPolygonToMap(map: Map, points: [number, number][], polygonId: string) {
  if (points.length < 3) return;
  if (map.getSource(polygonId)) {
    (map.getSource(polygonId) as GeoJSONSource).setData({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[...points, points[0]]] },
      properties: {},
    });
    return;
  }
  map.addSource(polygonId, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[...points, points[0]]] },
      properties: {},
    },
  });
  map.addLayer({
    id: polygonId,
    type: 'fill',
    source: polygonId,
    paint: {
      'fill-color': '#2563eb',
      'fill-opacity': 0.18,
    },
  });
  map.addLayer({
    id: polygonId + '-outline',
    type: 'line',
    source: polygonId,
    paint: {
      'line-color': '#2563eb',
      'line-width': 2.5,
    },
  });
}

export default Mapbox3DMap; 