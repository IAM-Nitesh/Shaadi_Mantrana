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
  try {
    // Get auth token from cookies
    const authToken = req.cookies.authToken;

    if (!authToken) {
      logger.debug('❌ Admin Users API: No auth token found');
      return res.status(401).json({ error: 'Authorization header required' });
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    if (req.method === 'GET') {
      logger.debug('🔍 Admin Users API: Fetching users list...');

      try {
        const response = await fetch(`${BACKEND_URL}/api/admin/users`, {
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
          logger.error('❌ Admin Users API: Backend error:', errorData);
          return res.status(response.status).json(errorData);
        }

        const data = await response.json();
        logger.debug('✅ Admin Users API: Successfully fetched users');
        return res.status(200).json(data);

      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          logger.error('❌ Admin Users API: Request timeout');
          return res.status(408).json({ error: 'Request timeout' });
        }

        logger.error('❌ Admin Users API: Fetch error:', fetchError);
        return res.status(500).json({ error: 'Failed to fetch admin users' });
      }

    } else if (req.method === 'POST') {
      logger.debug('🔍 Admin Users API: Adding new user...');

      try {
        const response = await fetch(`${BACKEND_URL}/api/admin/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(req.body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: response.statusText }));
          logger.error('❌ Admin Users API: Backend error:', errorData);
          return res.status(response.status).json(errorData);
        }

        const data = await response.json();
        logger.debug('✅ Admin Users API: Successfully added user');
        return res.status(200).json(data);

      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          logger.error('❌ Admin Users API: Request timeout');
          return res.status(408).json({ error: 'Request timeout' });
        }

        logger.error('❌ Admin Users API: Fetch error:', fetchError);
        return res.status(500).json({ error: 'Failed to add user' });
      }

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error: any) {
    logger.error('❌ Admin Users API: Error:', error);
    return res.status(500).json({ error: 'Failed to process admin users request' });
  }
}
