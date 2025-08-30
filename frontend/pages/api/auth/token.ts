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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    logger.debug('🔍 Token API: Starting token extraction...');

    // Get the authToken from cookies
    const authToken = req.cookies.authToken;

    if (!authToken) {
      logger.debug('❌ Token API: No authToken cookie found');
      return res.status(401).json({ success: false, error: 'No authentication token found' });
    }

    logger.debug('✅ Token API: Token found, length:', authToken.length);

    // Return the token for client-side use
    return res.status(200).json({
      success: true,
      token: authToken
    });

  } catch (error: any) {
    logger.error('❌ Token API: Error extracting token:', error);
    return res.status(500).json({ success: false, error: 'Failed to extract token' });
  }
}
