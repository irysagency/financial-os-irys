import { useAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

const BASE = '/api';

export function useApiClient() {
  const { getToken } = useAuth();

  const request = useCallback(async <T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> => {
    const token = await getToken();
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error((err as { error: string }).error ?? res.statusText);
    }

    return res.json() as Promise<T>;
  }, [getToken]);

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
    put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
    patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
    del: <T>(path: string) => request<T>('DELETE', path),
  };
}
