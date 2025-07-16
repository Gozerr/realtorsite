import { useState, useCallback, useRef, useEffect } from 'react';
import { apiWithRetry, handleApiError } from '../services/api';

interface UseApiOptions<T> {
  initialData?: T;
  cacheKey?: string;
  cacheTime?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  retryCount?: number;
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();

const useApi = <T>(
  url: string | null,
  options: UseApiOptions<T> = {}
): UseApiState<T> => {
  const {
    initialData = null,
    cacheKey,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    onSuccess,
    onError,
    retryCount = 3,
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;

    // Check cache first
    if (cacheKey) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        setData(cached.data);
        return;
      }
    }

    setLoading(true);
    setError(null);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await apiWithRetry.get(url, {
        signal: abortControllerRef.current.signal,
      });

      const responseData = response.data;
      setData(responseData);

      // Cache the result
      if (cacheKey) {
        cache.set(cacheKey, {
          data: responseData,
          timestamp: Date.now(),
        });
      }

      onSuccess?.(responseData);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Request was cancelled
      }

      const errorMessage = handleApiError(err);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [url, cacheKey, cacheTime, onSuccess, onError]);

  const refetch = useCallback(async () => {
    // Clear cache for this key
    if (cacheKey) {
      cache.delete(cacheKey);
    }
    await fetchData();
  }, [fetchData, cacheKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { data, loading, error, refetch };
};

// Hook for POST requests
export const useApiPost = <T, D = any>(
  url: string | null,
  options: UseApiOptions<T> = {}
) => {
  const [data, setData] = useState<T | null>(options.initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (postData: D) => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiWithRetry.post(url, postData);
      const responseData = response.data;
      setData(responseData);
      options.onSuccess?.(responseData);
      return responseData;
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      options.onError?.(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  return { execute, data, loading, error };
};

// Hook for PUT requests
export const useApiPut = <T, D = any>(
  url: string | null,
  options: UseApiOptions<T> = {}
) => {
  const [data, setData] = useState<T | null>(options.initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (putData: D) => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiWithRetry.put(url, putData);
      const responseData = response.data;
      setData(responseData);
      options.onSuccess?.(responseData);
      return responseData;
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      options.onError?.(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  return { execute, data, loading, error };
};

// Hook for DELETE requests
export const useApiDelete = <T>(
  url: string | null,
  options: UseApiOptions<T> = {}
) => {
  const [data, setData] = useState<T | null>(options.initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiWithRetry.delete(url);
      const responseData = response.data;
      setData(responseData);
      options.onSuccess?.(responseData);
      return responseData;
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      options.onError?.(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  return { execute, data, loading, error };
};

// Utility function to clear cache
export const clearApiCache = (key?: string) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};

export default useApi; 