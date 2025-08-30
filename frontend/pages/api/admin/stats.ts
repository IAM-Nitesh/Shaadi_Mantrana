import type { NextApiRequest, NextApiResponse } from 'next';

// Simple logger for API routes
const logger = {
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true') {
      console.log('[DEBUG]', ...args);
    }
  },
  error: (...args: any[]) => console.error('[ERROR]', ...args),
};

// Backend API URL from env
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://shaadi-mantrana.onrender.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    logger.debug('🔍 Admin Stats API: Fetching admin statistics...');

    // Get auth token from cookies
    const authToken = req.cookies.accessToken;

    if (!authToken) {
      logger.debug('❌ Admin Stats API: No auth token found');
      return res.status(401).json({ error: 'Authorization header required' });
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        logger.error('❌ Admin Stats API: Backend error:', errorData);
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      logger.debug('✅ Admin Stats API: Successfully fetched stats');
      return res.status(200).json(data);

    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        logger.error('❌ Admin Stats API: Request timeout');
        return res.status(408).json({ error: 'Request timeout' });
      }

      logger.error('❌ Admin Stats API: Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch admin stats' });
    }

  } catch (error: any) {
    logger.error('❌ Admin Stats API: Error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
}
