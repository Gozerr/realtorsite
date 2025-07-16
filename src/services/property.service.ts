import api from './api';
import { Property, PaginatedResponse, FilterOptions } from '../types';

export const getAllProperties = async (filters?: FilterOptions): Promise<Property[]> => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
  }
  
  const response = await api.get(`/api/properties?${params.toString()}`);
  // Унифицируем: если data - массив, возвращаем его, если объект с .properties - возвращаем его
  if (Array.isArray(response.data)) return response.data;
  if (response.data && Array.isArray(response.data.properties)) return response.data.properties;
  return [];
};

export const getPropertyById = async (id: string | number): Promise<Property> => {
  const response = await api.get(`/api/properties/${id}`);
  return response.data;
};

export const createProperty = async (propertyData: Partial<Property>): Promise<Property> => {
  const response = await api.post('/api/properties', propertyData);
  return response.data;
};

export const updateProperty = async (id: number, propertyData: Partial<Property>): Promise<Property> => {
  const response = await api.patch(`/api/properties/${id}`, propertyData);
  return response.data;
};

export const deleteProperty = async (id: number): Promise<void> => {
  await api.delete(`/api/properties/${id}`);
};

export const getMyProperties = async (): Promise<Property[]> => {
  const response = await api.get('/api/properties/my');
  return response.data;
};

export const getPropertiesByAgent = async (agentId: number): Promise<Property[]> => {
  return getAllProperties({ agentId });
};

export const getPropertiesByAgency = async (agencyId: number): Promise<Property[]> => {
  const response = await api.get(`/api/properties/agency/${agencyId}`);
  return response.data;
};

export const uploadPropertyPhotos = async (propertyId: number, files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append('photos', file);
  });
  
  const response = await api.post(`/api/properties/${propertyId}/photos`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data.urls;
};

export const deletePropertyPhoto = async (propertyId: number, photoUrl: string): Promise<void> => {
  await api.delete(`/api/properties/${propertyId}/photos`, {
    data: { photoUrl }
  });
};

export const getPropertyStats = async (): Promise<any> => {
  const response = await api.get('/api/properties/stats');
  return response.data;
};

export const searchProperties = async (query: string): Promise<Property[]> => {
  const response = await api.get(`/api/properties/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const getSimilarProperties = async (propertyId: number): Promise<Property[]> => {
  const response = await api.get(`/api/properties/${propertyId}/similar`);
  return response.data;
};

export const togglePropertyFavorite = async (propertyId: number): Promise<void> => {
  await api.post(`/api/properties/${propertyId}/favorite`);
};

export const getFavoriteProperties = async (): Promise<Property[]> => {
  const response = await api.get('/api/properties/favorites');
  return response.data;
};

export const exportProperties = async (filters?: FilterOptions): Promise<Blob> => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
  }
  
  const response = await api.get(`/api/properties/export?${params.toString()}`, {
    responseType: 'blob'
  });
  
  return response.data;
}; 

export const getRecentProperties = async (): Promise<Property[]> => {
  const response = await api.get('/api/properties?sort=createdAt_desc&limit=10');
  // Унифицируем: если data - массив, возвращаем его, если объект с .properties - возвращаем его
  if (Array.isArray(response.data)) return response.data;
  if (response.data && Array.isArray(response.data.properties)) return response.data.properties;
  return [];
};

export const updatePropertyStatus = async (id: number, status: string, token?: string): Promise<Property> => {
  const response = await api.patch(`/api/properties/${id}/status`, { status }, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  return response.data;
}; 