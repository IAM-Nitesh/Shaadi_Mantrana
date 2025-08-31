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
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    logger.debug('🔍 Auth Logout API: Starting logout process...');

    // Get auth token from cookies
    const authToken = req.cookies.accessToken;

    if (authToken) {
      // Call backend logout endpoint
      const backendUrl = BACKEND_URL;
      await fetch(`${backendUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }).catch(() => {
        // Ignore backend errors during logout
        logger.debug('🔍 Auth Logout API: Backend logout call completed (errors ignored)');
      });
    }

    // Clear all authentication cookies
    logger.debug('🔍 Auth Logout API: Clearing authentication cookies');

    res.setHeader('Set-Cookie', [
      'accessToken=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/',
      'refreshToken=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/',
      'sessionId=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/'
    ]);

    return res.status(200).json({
      success: true,
      message: 'Successfully logged out'
    });

  } catch (error: any) {
    logger.error('❌ Auth Logout API: Logout error:', error);

    // Still clear cookies even if there's an error
    res.setHeader('Set-Cookie', [
      'accessToken=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/',
      'refreshToken=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/',
      'sessionId=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/'
    ]);

    return res.status(200).json({
      success: true,
      message: 'Logged out'
    });
  }
}
