import api from './api';
import { LoginCredentials, User } from '../types';
import { getFullDeviceInfo, DeviceInfo } from '../utils/deviceFingerprint';

// Временные типы для восстановления пароля
interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

interface ForgotPasswordResponse {
  message: string;
}

interface ResetPasswordResponse {
  message: string;
}

export const login = async (credentials: LoginCredentials, config?: any): Promise<{ access_token: string; user: User }> => {
  try {
    // Получаем информацию об устройстве
    const deviceInfo = await getFullDeviceInfo();
    
    const response = await api.post('/api/auth/login', {
      ...credentials,
      deviceInfo,
    }, config);
    return response.data;
  } catch (error) {
    // Если не удалось получить информацию об устройстве, отправляем без неё
    const response = await api.post('/api/auth/login', credentials, config);
    return response.data;
  }
};

export const register = async (formData: FormData): Promise<any> => {
  const response = await api.post('/api/auth/register', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateProfile = async (userData: Partial<User>): Promise<User> => {
  const response = await api.patch('/api/users/profile', userData);
  return response.data;
};

export const updateUser = async (id: number, userData: Partial<User>): Promise<User> => {
  const response = await api.patch(`/api/users/${id}`, userData);
  return response.data;
};

export const getProfile = async (token?: string): Promise<User> => {
  const response = await api.get('/api/users/profile', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
};

// Получить новый access_token по refresh_token (cookie)
export async function refreshToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // чтобы отправлялись cookies
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

// Запрос на восстановление пароля
export const forgotPassword = async (email: string): Promise<ForgotPasswordResponse> => {
  const response = await api.post<ForgotPasswordResponse>('/api/auth/forgot-password', { email });
  return response.data;
};

// Сброс пароля по токену
export const resetPassword = async (token: string, newPassword: string): Promise<ResetPasswordResponse> => {
  const response = await api.post<ResetPasswordResponse>('/api/auth/reset-password', { 
    token, 
    newPassword 
  });
  return response.data;
}; 