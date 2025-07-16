import api from './api';

export interface Agency {
  id: number;
  name: string;
  verified: boolean;
  documents?: string[];
}

export const getMyAgency = async (user?: any): Promise<Agency | null> => {
  if (user && (user.role === 'support' || !user.agencyId)) {
    return null;
  }
  const response = await api.get('/api/agencies/my-agency');
  return response.data;
};

export const uploadAgencyDocuments = async (formData: FormData): Promise<any> => {
  const response = await api.post('/api/agencies/upload-documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const searchAgencies = async (query: string): Promise<Agency[]> => {
  const response = await api.get(`/api/agencies?search=${encodeURIComponent(query)}`);
  return response.data;
};

export const uploadAgencyLogo = async (formData: FormData): Promise<any> => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/agencies/upload-logo', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Ошибка при загрузке логотипа');
  }

  return response.json();
};

export const getMyAgencyAgents = async (): Promise<any[]> => {
  const response = await api.get('/api/agencies/my-agency/agents');
  return response.data;
};

export const getMyAgencyManagers = async (): Promise<any[]> => {
  const response = await api.get('/api/agencies/my-agency/managers');
  return response.data;
};

export const getMyAgencyProperties = async (): Promise<any[]> => {
  const response = await api.get('/api/properties/agency');
  return response.data;
};

export const fireAgent = async (id: number, reason?: string): Promise<any> => {
  const response = await api.patch(`/api/users/${id}/fire`, { reason });
  return response.data;
};

export const restoreAgent = async (id: number): Promise<any> => {
  const response = await api.patch(`/api/users/${id}/restore`);
  return response.data;
}; 