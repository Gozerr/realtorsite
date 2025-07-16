import api from './api';
import { Client, PaginatedResponse, FilterOptions } from '../types';

export const getClients = async (filters?: FilterOptions): Promise<Client[]> => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
  }
  
  const response = await api.get(`/api/clients?${params.toString()}`);
  // Унифицируем: если data - массив, возвращаем его, если объект с .clients - возвращаем его
  if (Array.isArray(response.data)) return response.data;
  if (response.data && Array.isArray(response.data.clients)) return response.data.clients;
  return [];
};

export const getClientById = async (id: number): Promise<Client> => {
  const response = await api.get(`/api/clients/${id}`);
  return response.data;
};

export const createClient = async (clientData: Partial<Client>): Promise<Client> => {
  const response = await api.post('/api/clients', clientData);
  return response.data;
};

export const updateClient = async (id: number, clientData: Partial<Client>): Promise<Client> => {
  const response = await api.patch(`/api/clients/${id}`, clientData);
  return response.data;
};

export const deleteClient = async (id: number): Promise<void> => {
  await api.delete(`/api/clients/${id}`);
};

export const getMyClients = async (): Promise<Client[]> => {
  const response = await api.get('/api/clients/my');
  return response.data;
};

export const getClientsByAgent = async (agentId: number): Promise<Client[]> => {
  return getClients({ agentId });
};

export const updateClientStatus = async (id: number, status: string): Promise<Client> => {
  const response = await api.patch(`/api/clients/${id}/status`, { status });
  return response.data;
};

export const getClientStats = async (): Promise<any> => {
  const response = await api.get('/api/clients/stats');
  return response.data;
};

export const searchClients = async (query: string): Promise<Client[]> => {
  const response = await api.get(`/api/clients/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const exportClients = async (filters?: FilterOptions): Promise<Blob> => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
  }
  
  const response = await api.get(`/api/clients/export?${params.toString()}`, {
    responseType: 'blob'
  });
  
  return response.data;
};

export const importClients = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/clients/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
}; 

export const getAgencyClients = async (): Promise<Client[]> => {
  const response = await api.get('/api/clients/agency');
  return response.data;
}; 