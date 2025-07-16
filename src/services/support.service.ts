import api from './api';

export interface CreateSupportRequestData {
  lastName: string;
  firstName: string;
  middleName: string;
  phone: string;
  problem: string;
}

export interface SupportRequest {
  id: number;
  userId: number;
  lastName: string;
  firstName: string;
  middleName: string;
  phone: string;
  problem: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: number;
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export const createSupportRequest = async (data: CreateSupportRequestData) => {
  const response = await api.post('/api/support/requests', data);
  return response.data;
};

export const getSupportRequests = async (): Promise<SupportRequest[]> => {
  const response = await api.get('/api/support/requests');
  return response.data;
};

export const getPendingSupportRequests = async (): Promise<SupportRequest[]> => {
  const response = await api.get('/api/support/requests/pending');
  return response.data;
};

export const getSupportRequest = async (id: number): Promise<SupportRequest> => {
  const response = await api.get(`/api/support/requests/${id}`);
  return response.data;
};

export const assignSupportRequest = async (id: number) => {
  const response = await api.patch(`/api/support/requests/${id}/assign`);
  return response.data;
};

export const resolveSupportRequest = async (id: number, resolution: string) => {
  const response = await api.patch(`/api/support/requests/${id}/resolve`, { resolution });
  return response.data;
};

export const closeSupportRequest = async (id: number) => {
  const response = await api.patch(`/api/support/requests/${id}/close`);
  return response.data;
};

export const getSupportStats = async () => {
  const response = await api.get('/api/support/stats');
  return response.data;
};

// Новые методы для авторизации агентства
export const getPendingAgencyAuthorizations = async () => {
  const response = await api.get('/api/support/agency-authorization/pending');
  return response.data;
};

export const getAgencyAuthorizationDetails = async (userId: number) => {
  const response = await api.get(`/api/support/agency-authorization/${userId}`);
  return response.data;
};

export const approveAgencyAuthorization = async (userId: number) => {
  const response = await api.patch(`/api/support/agency-authorization/${userId}/approve`);
  return response.data;
};

export const rejectAgencyAuthorization = async (userId: number, reason: string) => {
  const response = await api.patch(`/api/support/agency-authorization/${userId}/reject`, { reason });
  return response.data;
}; 