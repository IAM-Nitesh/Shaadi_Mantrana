// Client-side auth helpers that call server APIs.
import { apiClient } from './api-client';

// In-memory cache + inflight dedupe for auth status
let authStatusCache: { value: any; expiresAt: number } | null = null;
let authStatusInflight: Promise<any> | null = null;
const AUTH_STATUS_TTL_MS = 5000; // 5 seconds

export async function getAuthStatus(force = false) {
  // Return cached if valid
  const now = Date.now();
  if (!force && authStatusCache && authStatusCache.expiresAt > now) {
    return authStatusCache.value;
  }

  // Coalesce concurrent callers
  if (!force && authStatusInflight) {
    try {
      return await authStatusInflight;
    } catch {
      // fallthrough to make a new request
    }
  }

  const doFetch = async () => {
    try {
      const res = await apiClient.get(`/api/auth/status${force ? `?t=${Date.now()}` : ''}`, {
        timeout: 15000,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      let data: any;
      if (res.status === 304) {
        const freshRes = await apiClient.get(`/api/auth/status?t=${Date.now()}`, { timeout: 15000 });
        data = freshRes.ok ? freshRes.data : { authenticated: false };
      } else {
        data = res.ok ? res.data : { authenticated: false };
      }

      // Cache policy:
      // - Cache authenticated=true responses for AUTH_STATUS_TTL_MS
      // - Do NOT cache negative results to avoid stale unauth right after login
      if (data && typeof data === 'object' && 'authenticated' in data) {
        if (data.authenticated === true) {
          authStatusCache = { value: data, expiresAt: Date.now() + AUTH_STATUS_TTL_MS };
        } else {
          // ensure negative cache is cleared
          authStatusCache = null;
        }
      }
      return data;
    } catch (err) {
      return { authenticated: false };
    }
  };

  if (force) {
    // Bypass inflight coalescing for a hard refresh
    return doFetch();
  }

  authStatusInflight = doFetch().finally(() => {
    authStatusInflight = null;
  });

  return authStatusInflight;
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
  // Invalidate cached auth state
  authStatusCache = null;
  authStatusInflight = null;
}
