import React, { createContext, useContext, useState, useCallback } from 'react';
import { Property } from '../types';
import { geocodeAddress, getCityByIP } from '../utils/geocode';
import { AuthContext } from './AuthContext';
import api from '../services/api';
import debounce from 'lodash.debounce';

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
  // Расширенные фильтры:
  minYear?: number;
  maxYear?: number;
  minFloor?: number;
  maxFloor?: number;
  minFloors?: number;
  maxFloors?: number;
  material?: string;
  balcony?: boolean;
  lift?: boolean;
  parking?: boolean;
  furniture?: boolean;
  tech?: boolean;
  onlyWithPhoto?: boolean;
  isNew?: boolean;
  isSecondary?: boolean;
  sort?: string;
};

interface PropertiesContextType {
  filters: PropertiesFilters;
  setFilters: (f: PropertiesFilters) => void;
  updateFilters: (f: Partial<PropertiesFilters>) => void;
  resetFilters: () => void;
  bbox: [number, number, number, number] | null;
  setBbox: (b: [number, number, number, number] | null) => void;
  properties: Property[];
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
  loading: boolean;
  setLoading: (l: boolean) => void;
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  center: [number, number];
  setCenter: (c: [number, number]) => void;
}

const PropertiesContext = createContext<PropertiesContextType | undefined>(undefined);

export const usePropertiesContext = () => {
  const ctx = useContext(PropertiesContext);
  if (!ctx) throw new Error('usePropertiesContext must be used within PropertiesProvider');
  return ctx;
};

export const PropertiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = React.useContext(AuthContext);
  const [filters, setFilters] = useState<PropertiesFilters>({});
  const updateFilters = useCallback((f: Partial<PropertiesFilters>) => setFilters(prev => ({ ...prev, ...f })), []);
  const resetFilters = useCallback(() => setFilters({}), []);
  const [bbox, setBbox] = useState<[number, number, number, number] | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [center, setCenter] = useState<[number, number]>([57.626, 39.893]);

  // Автоматическое определение города риэлтора
  React.useEffect(() => {
    let cancelled = false;
    async function detectCity() {
      if (auth?.user?.city) {
        const coords = await geocodeAddress(auth.user.city);
        if (coords && !cancelled) setCenter([coords.lat, coords.lng]);
      } else {
        const city = await getCityByIP();
        if (city) {
          const coords = await geocodeAddress(city);
          if (coords && !cancelled) setCenter([coords.lat, coords.lng]);
        }
      }
    }
    detectCity();
    return () => { cancelled = true; };
  }, [auth?.user?.city]);

  // Автоматическая загрузка объектов при изменении bbox или filters
  React.useEffect(() => {
    let cancelled = false;
    const fetchProperties = async () => {
      setLoading(true);
      // Проверяем, что bbox — массив из 4 чисел
      const validBbox = Array.isArray(bbox) && bbox.length === 4 && bbox.every(x => typeof x === 'number' && !isNaN(x));
      const isBboxTooLarge = validBbox && (Math.abs(bbox[2] - bbox[0]) > 10 || Math.abs(bbox[3] - bbox[1]) > 10);
      const isBboxTooSmall = validBbox && (Math.abs(bbox[2] - bbox[0]) < 0.001 || Math.abs(bbox[3] - bbox[1]) < 0.001);
      let url = '';
      if (validBbox && !isBboxTooLarge && !isBboxTooSmall) {
        url = '/api/properties/map?bbox=' + bbox.join(',');
        if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
        if (filters.minPrice) url += `&minPrice=${filters.minPrice}`;
        if (filters.maxPrice) url += `&maxPrice=${filters.maxPrice}`;
        if (filters.status) url += `&status=${filters.status}`;
        if (filters.minArea) url += `&minArea=${filters.minArea}`;
        if (filters.maxArea) url += `&maxArea=${filters.maxArea}`;
        if (filters.type) url += `&type=${filters.type}`;
        if (filters.rooms) url += `&rooms=${filters.rooms}`;
        if (filters.poi && filters.poi.length > 0) url += `&poi=${filters.poi.join(',')}`;
      } else if (Object.keys(filters).length > 0) {
        url = '/api/properties?';
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
      } else {
        // Нет bbox и нет фильтров — подгружаем все объекты
        url = '/api/properties';
      }
      if (url.includes('/api/properties/map') && !validBbox) {
        setLoading(false);
        return;
      }
      console.log('[PropertiesContext] bbox:', bbox, 'filters:', filters, 'url:', url);
      try {
        const res = await api.get(url);
        if (!cancelled) {
          if (validBbox && !isBboxTooLarge && !isBboxTooSmall) {
            // Проверяем, есть ли объекты с lat/lng внутри bbox
            const inBbox = res.data.filter((p: any) =>
              typeof p.lat === 'number' && typeof p.lng === 'number' &&
              p.lat >= bbox[1] && p.lat <= bbox[3] &&
              p.lng >= bbox[0] && p.lng <= bbox[2]
            );
            if (inBbox.length === 0) {
              // Fallback на все объекты
              const all = await api.get('/api/properties');
              setProperties(Array.isArray(all.data) ? all.data : all.data.properties || []);
            } else {
              setProperties(Array.isArray(res.data) ? res.data : res.data.properties || []);
            }
          } else {
            setProperties(Array.isArray(res.data) ? res.data : res.data.properties || []);
          }
        }
      } catch (e) {
        if (!cancelled) setProperties([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const debouncedFetch = debounce(fetchProperties, 300);
    debouncedFetch();
    return () => {
      cancelled = true;
      debouncedFetch.cancel && debouncedFetch.cancel();
    };
  }, [bbox, filters]);

  return (
    <PropertiesContext.Provider value={{
      filters, setFilters, updateFilters, resetFilters,
      bbox, setBbox,
      properties, setProperties,
      loading, setLoading,
      selectedId, setSelectedId,
      center, setCenter
    }}>
      {children}
    </PropertiesContext.Provider>
  );
}; 