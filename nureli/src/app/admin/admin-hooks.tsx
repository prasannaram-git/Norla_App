'use client';

/**
 * Shared admin hooks and API helpers.
 * 
 * All admin pages use these to auto-redirect to login on 401 expired tokens.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Shared admin fetch wrapper that handles auth token and auto-redirects on 401.
 */
export function useAdminFetch<T>(url: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
        return;
      }
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error(`[Admin] Fetch error for ${url}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, router, ...deps]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Make an authenticated admin API call (POST/PUT/DELETE).
 * Auto-redirects to login on 401.
 */
export async function adminApiCall(
  url: string,
  options: { method?: string; body?: unknown } = {},
  router?: ReturnType<typeof useRouter>
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    if (router) router.push('/admin/login');
    return { ok: false, error: 'Not authenticated' };
  }

  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });

    if (res.status === 401) {
      localStorage.removeItem('admin_token');
      if (router) router.push('/admin/login');
      return { ok: false, error: 'Session expired' };
    }

    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` };
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}
