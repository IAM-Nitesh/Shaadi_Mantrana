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

    let backendSetCookie: string | null = null;
    if (authToken || req.headers.cookie) {
      // Call backend logout endpoint and forward cookies so backend can revoke session
      const backendUrl = BACKEND_URL;
      try {
        const backendResp = await fetch(`${backendUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': authToken ? `Bearer ${authToken}` : '',
            'Content-Type': 'application/json',
            'Cookie': req.headers.cookie || ''
          },
        });
        // Capture any Set-Cookie headers from backend so we can forward them
        try {
          backendSetCookie = backendResp.headers.get('set-cookie');
          if (backendSetCookie) {
            // Forward backend cookies as-is and avoid overriding them later
            res.setHeader('Set-Cookie', backendSetCookie as any);
            logger.debug('🔄 Auth Logout API: Forwarded Set-Cookie from backend logout');
          }
        } catch (e) {
          logger.debug('🔄 Auth Logout API: Could not read Set-Cookie header from backend:', e);
          backendSetCookie = null;
        }
      } catch (e) {
        logger.debug('🔍 Auth Logout API: Backend logout call failed (errors ignored)', e);
      }
    }
    // Clear all authentication cookies (only if backend didn't already set cookies)
    logger.debug('🔍 Auth Logout API: Clearing authentication cookies (if backend did not)');

    const isSecure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
    const sameSite = isSecure ? 'None' : 'Lax';

    // Helper to build cookie string correctly (include Secure token only when needed)
    const buildClearCookie = (name: string) => `${name}=; HttpOnly; ${isSecure ? 'Secure; ' : ''}SameSite=${sameSite}; Max-Age=0; Path=/`;

    if (!backendSetCookie) {
      res.setHeader('Set-Cookie', [
        buildClearCookie('accessToken'),
        buildClearCookie('refreshToken'),
        buildClearCookie('sessionId')
      ]);
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully logged out'
    });

  } catch (error: any) {
    logger.error('❌ Auth Logout API: Logout error:', error);

    // Still clear cookies even if there's an error. Use the same helper to
    // build cookie strings so formatting is consistent with the success path.
    const isSecure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
    const sameSite = isSecure ? 'None' : 'Lax';
    const buildClearCookie = (name: string) => `${name}=; HttpOnly; ${isSecure ? 'Secure; ' : ''}SameSite=${sameSite}; Max-Age=0; Path=/`;
    res.setHeader('Set-Cookie', [
      buildClearCookie('accessToken'),
      buildClearCookie('refreshToken'),
      buildClearCookie('sessionId')
    ]);

    return res.status(200).json({
      success: true,
      message: 'Logged out'
    });
  }
}
