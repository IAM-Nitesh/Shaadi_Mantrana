import { apiClient } from './api-client';

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
    // Use apiClient directly - it will handle authentication via cookies
    const res = await apiClient.get('/api/admin/stats', {
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