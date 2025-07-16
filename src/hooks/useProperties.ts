import { useState, useEffect, useCallback } from 'react';
import { Property } from '../types';
import { geocodeAddress, getCityByIP } from '../utils/geocode';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export type PropertiesFilters = {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  minArea?: number;
  maxArea?: number;
  type?: string;
  rooms?: number;
  poi?: string[];
};

export function useProperties({
  initialFilters = {},
  initialBbox = null,
  initialSelectedId = null,
  autoDetectLocation = false,
  authUser = null,
}: {
  initialFilters?: PropertiesFilters;
  initialBbox?: [number, number, number, number] | null;
  initialSelectedId?: number | null;
  autoDetectLocation?: boolean;
  authUser?: any;
} = {}) {
  const [filters, setFilters] = useState<PropertiesFilters>(initialFilters);
  const [bbox, setBbox] = useState<[number, number, number, number] | null>(initialBbox);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(initialSelectedId);
  const [center, setCenter] = useState<[number, number]>([55.751244, 37.618423]);
  const [geoLocated, setGeoLocated] = useState(false);

  // Получение центра карты (геолокация/город)
  useEffect(() => {
    if (!autoDetectLocation || geoLocated) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter([pos.coords.latitude, pos.coords.longitude]);
          setGeoLocated(true);
        },
        async () => {
          let city = authUser?.city || (await getCityByIP());
          if (city) {
            const coords = await geocodeAddress(city);
            if (coords) setCenter([coords.lat, coords.lng]);
          }
          setGeoLocated(true);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      (async () => {
        let city = authUser?.city || (await getCityByIP());
        if (city) {
          const coords = await geocodeAddress(city);
          if (coords) setCenter([coords.lat, coords.lng]);
        }
        setGeoLocated(true);
      })();
    }
  }, [autoDetectLocation, authUser, geoLocated]);

  // Получение объектов по bbox и фильтрам
  const fetchProperties = useCallback(async (newBbox?: [number, number, number, number], newFilters?: PropertiesFilters) => {
    setLoading(true);
    let url = '/api/properties/map?';
    const bboxToUse = newBbox || bbox;
    if (bboxToUse) {
      url += `bbox=${bboxToUse.join(',')}`;
    }
    const f = newFilters || filters;
    if (f.search) url += `&search=${encodeURIComponent(f.search)}`;
    if (f.minPrice) url += `&minPrice=${f.minPrice}`;
    if (f.maxPrice) url += `&maxPrice=${f.maxPrice}`;
    if (f.status) url += `&status=${f.status}`;
    if (f.minArea) url += `&minArea=${f.minArea}`;
    if (f.maxArea) url += `&maxArea=${f.maxArea}`;
    if (f.type) url += `&type=${f.type}`;
    if (f.rooms) url += `&rooms=${f.rooms}`;
    if (f.poi && f.poi.length > 0) url += `&poi=${f.poi.join(',')}`;
    // Fallback: если bbox не задан, убираем bbox из url (или подгружаем все объекты по фильтрам)
    if (!bboxToUse) {
      url = '/api/properties?';
      if (f.search) url += `search=${encodeURIComponent(f.search)}&`;
      if (f.minPrice) url += `minPrice=${f.minPrice}&`;
      if (f.maxPrice) url += `maxPrice=${f.maxPrice}&`;
      if (f.status) url += `status=${f.status}&`;
      if (f.minArea) url += `minArea=${f.minArea}&`;
      if (f.maxArea) url += `maxArea=${f.maxArea}&`;
      if (f.type) url += `type=${f.type}&`;
      if (f.rooms) url += `rooms=${f.rooms}&`;
      if (f.poi && f.poi.length > 0) url += `poi=${f.poi.join(',')}&`;
      url = url.replace(/&$/, '');
    }
    try {
      const res = await api.get(url);
      setProperties(Array.isArray(res.data) ? res.data : res.data.properties || []);
    } catch (e) {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [bbox, filters]);

  // Подгружать объекты при изменении bbox или фильтров
  useEffect(() => {
    fetchProperties();
    // eslint-disable-next-line
  }, [bbox, filters]);

  // Обновить bbox (например, при изменении границ карты)
  const updateBbox = (newBbox: [number, number, number, number]) => {
    setBbox(newBbox);
  };

  // Обновить фильтры
  const updateFilters = (newFilters: Partial<PropertiesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Сбросить фильтры
  const resetFilters = () => {
    setFilters({});
  };

  // Выбрать объект
  const selectProperty = (id: number | null) => {
    setSelectedId(id);
  };

  return {
    properties,
    loading,
    filters,
    updateFilters,
    resetFilters,
    bbox,
    updateBbox,
    selectedId,
    selectProperty,
    center,
    setCenter,
  };
}

export async function getAllProperties(filters: PropertiesFilters = {}): Promise<Property[]> {
  let url = '/api/properties?';
  if (filters.search) url += `search=${encodeURIComponent(filters.search)}&`;
  if (filters.minPrice) url += `minPrice=${filters.minPrice}&`;
  if (filters.maxPrice) url += `maxPrice=${filters.maxPrice}&`;
  if (filters.status) url += `status=${filters.status}&`;
  if (filters.minArea) url += `minArea=${filters.minArea}&`;
  if (filters.maxArea) url += `maxArea=${filters.maxArea}&`;
  if (filters.type) url += `type=${filters.type}&`;
  if (filters.rooms) url += `rooms=${filters.rooms}&`;
  if (filters.poi && filters.poi.length > 0) url += `poi=${filters.poi.join(',')}&`;
  url = url.replace(/&$/, '');
  const response = await api.get(url);
  return Array.isArray(response.data) ? response.data : response.data.properties || [];
}

export function useAllProperties(initialFilters: PropertiesFilters = {}) {
  const [filters, setFilters] = useState<PropertiesFilters>(initialFilters);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAllProperties(filters).then(data => {
      setProperties(data);
      setLoading(false);
    });
  }, [filters]);

  const updateFilters = (newFilters: Partial<PropertiesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  const resetFilters = () => setFilters({});

  return { properties, loading, filters, updateFilters, resetFilters };
} 