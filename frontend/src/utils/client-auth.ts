// Client-side auth helpers that call server APIs.
import { apiClient } from './api-client';

export async function getAuthStatus() {
  try {
    const res = await apiClient.get('/api/auth/status', {
      timeout: 15000,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (res.status === 304) {
      const freshRes = await apiClient.get(`/api/auth/status?t=${Date.now()}`, { timeout: 15000 });
      if (!freshRes.ok) return { authenticated: false };
      return freshRes.data;
    }

    if (!res.ok) return { authenticated: false };
    return res.data;
  } catch (err) {
    return { authenticated: false };
  }
}

export async function getClientToken(): Promise<string | null> {
  try {
    const res = await apiClient.get('/api/auth/token', { timeout: 10000 });
    if (!res.ok) return null;
    return res.data?.token || null;
  } catch (err) {
    return null;
  }
}

export async function clientLogout() {
  try {
    await apiClient.post('/api/auth/logout', undefined, { timeout: 10000 });
  } catch (err) {
    // ignore
  }
}
