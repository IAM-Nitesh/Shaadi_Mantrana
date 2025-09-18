import { apiClient } from './api-client';
import { getClientToken } from './client-auth';

type AdminStatsResponse = {
  stats: any;
};

let statsCache: { value: AdminStatsResponse; expiresAt: number } | null = null;
let statsInflight: Promise<AdminStatsResponse> | null = null;
const STATS_TTL_MS = 30_000; // 30 seconds

export async function getAdminStats(): Promise<AdminStatsResponse> {
  const now = Date.now();
  if (statsCache && statsCache.expiresAt > now) {
    return statsCache.value;
  }

  if (statsInflight) {
    try {
      return await statsInflight;
    } catch {
      // ignore and proceed to new request
    }
  }

  statsInflight = (async () => {
    const token = await getClientToken();
    if (!token) {
      // do not cache negative — let callers handle unauth
      throw new Error('No auth token');
    }

    const res = await apiClient.get('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    });

    if (!res.ok) {
      throw new Error(`Stats fetch failed: ${res.status}`);
    }

    const value: AdminStatsResponse = res.data;
    statsCache = { value, expiresAt: Date.now() + STATS_TTL_MS };
    return value;
  })();

  try {
    const v = await statsInflight;
    return v;
  } finally {
    statsInflight = null;
  }
}

export function invalidateAdminStats() {
  statsCache = null;
}