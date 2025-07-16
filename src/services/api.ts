import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import React from 'react';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: { startTime: Date };
}

// Определяем базовый URL API в зависимости от окружения
export function getApiBaseUrl() {
  if (process.env.NODE_ENV === 'production') {
    // В продакшене используем переменную окружения или домен
    return process.env.REACT_APP_API_URL || 'https://api.yourdomain.com';
  }
  // В разработке используем proxy или localhost
  return process.env.REACT_APP_API_URL || 'http://localhost:3001';
}

export function getApiPrefix() {
  return process.env.REACT_APP_API_PREFIX || '/api';
}

// API Configuration
const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: 10000, // 10 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
};

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    (config as CustomAxiosRequestConfig).metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response time
    const endTime = new Date();
    const startTime = (response.config as CustomAxiosRequestConfig).metadata?.startTime;
    if (startTime) {
      const duration = endTime.getTime() - startTime.getTime();
      console.debug(`API call to ${response.config.url} took ${duration}ms`);
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
        .then((token) => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        })
        .catch(err => Promise.reject(err));
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const res = await api.post('/auth/refresh', {}, { withCredentials: true });
        const newToken = res.data.access_token;
        localStorage.setItem('token', newToken);
        setupAuthAutoRefresh();
        processQueue(null, newToken);
        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
      return Promise.reject(new Error('Access denied'));
    }
    
    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.error('Resource not found:', error.response.data);
      return Promise.reject(new Error('Resource not found'));
    }
    
    // Handle 500+ server errors
    if (error.response?.status && error.response.status >= 500) {
      console.error('Server error:', error.response.data);
      return Promise.reject(new Error('Server error occurred'));
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject(new Error('Network error occurred'));
    }
    
    // Handle other errors
    const errorMessage =
      (error.response?.data && (error.response.data as any).message) ||
      error.message ||
      'An error occurred';
    console.error('API error:', errorMessage);
    message.error({
      content: errorMessage,
      duration: 4,
      icon: React.createElement(CloseCircleOutlined, { style: { color: '#ff4d4f' } }),
      style: { marginTop: 60 },
    });
    return Promise.reject(new Error(errorMessage));
  }
);

// Retry function for failed requests
const retryRequest = async (fn: () => Promise<any>, retries: number = API_CONFIG.retries): Promise<any> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && shouldRetry(error)) {
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay));
      return retryRequest(fn, retries - 1);
    }
    throw error;
  }
};

// Check if request should be retried
const shouldRetry = (error: any): boolean => {
  // Retry on network errors or 5xx server errors
  return !error.response || (error.response.status >= 500 && error.response.status < 600);
};

// Enhanced API methods with retry logic
export const apiWithRetry = {
  get: (url: string, config?: any) => retryRequest(() => api.get(url, config)),
  post: (url: string, data?: any, config?: any) => retryRequest(() => api.post(url, data, config)),
  put: (url: string, data?: any, config?: any) => retryRequest(() => api.put(url, data, config)),
  delete: (url: string, config?: any) => retryRequest(() => api.delete(url, config)),
  patch: (url: string, data?: any, config?: any) => retryRequest(() => api.patch(url, data, config)),
};

// Utility functions
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const isNetworkError = (error: any): boolean => {
  return !error.response;
};

export const isServerError = (error: any): boolean => {
  return error.response?.status >= 500;
};

export const isClientError = (error: any): boolean => {
  return error.response?.status >= 400 && error.response?.status < 500;
};

// --- Auto-refresh access_token by timer (optional, for better UX) ---
// This requires access_token to be a JWT with exp field
function getTokenExp(token: string | null): number | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

let refreshTimeout: ReturnType<typeof setTimeout> | undefined;
function scheduleTokenRefresh() {
  if (refreshTimeout) clearTimeout(refreshTimeout);
  const token = localStorage.getItem('token');
  const exp = getTokenExp(token);
  if (!exp) return; // Can't schedule without exp
  const now = Date.now();
  const msBeforeExpiry = exp - now - 60 * 1000; // 1 min before expiry
  if (msBeforeExpiry > 0) {
    refreshTimeout = setTimeout(async () => {
      try {
        await api.post('/auth/refresh', {}, { withCredentials: true });
        scheduleTokenRefresh();
      } catch {
        // If refresh fails, user will be logged out by interceptor
      }
    }, msBeforeExpiry);
  }
}

// Call this after login and after each refresh
export function setupAuthAutoRefresh() {
  scheduleTokenRefresh();
}

export default api; 