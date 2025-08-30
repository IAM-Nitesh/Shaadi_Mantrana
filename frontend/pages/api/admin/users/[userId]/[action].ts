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
    const { userId, action } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!action || typeof action !== 'string') {
      return res.status(400).json({ error: 'Action is required' });
    }

    logger.debug(`🔍 Admin User Action API: ${action} for user ${userId}`);

    // Get auth token from cookies
    const authToken = req.cookies.authToken;

    if (!authToken) {
      logger.debug('❌ Admin User Action API: No auth token found');
      return res.status(401).json({ error: 'Authorization header required' });
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    if (req.method === 'POST') {
      try {
        const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/${action}`, {
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
          logger.error(`❌ Admin User Action API: Backend error for ${action}:`, errorData);
          return res.status(response.status).json(errorData);
        }

        const data = await response.json();
        logger.debug(`✅ Admin User Action API: Successfully performed ${action}`);
        return res.status(200).json(data);

      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          logger.error(`❌ Admin User Action API: Request timeout for ${action}`);
          return res.status(408).json({ error: 'Request timeout' });
        }

        logger.error(`❌ Admin User Action API: Fetch error for ${action}:`, fetchError);
        return res.status(500).json({ error: `Failed to ${action} user` });
      }

    } else if (req.method === 'PATCH') {
      try {
        const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/${action}`, {
          method: 'PATCH',
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
          logger.error(`❌ Admin User Action API: Backend error for ${action}:`, errorData);
          return res.status(response.status).json(errorData);
        }

        const data = await response.json();
        logger.debug(`✅ Admin User Action API: Successfully performed ${action}`);
        return res.status(200).json(data);

      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          logger.error(`❌ Admin User Action API: Request timeout for ${action}`);
          return res.status(408).json({ error: 'Request timeout' });
        }

        logger.error(`❌ Admin User Action API: Fetch error for ${action}:`, fetchError);
        return res.status(500).json({ error: `Failed to ${action} user` });
      }

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error: any) {
    logger.error('❌ Admin User Action API: Error:', error);
    return res.status(500).json({ error: 'Failed to process admin user action' });
  }
}
