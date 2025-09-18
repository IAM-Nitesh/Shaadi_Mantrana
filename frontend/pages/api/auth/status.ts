import type { NextApiRequest, NextApiResponse } from 'next';// Simple logger for API routes
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
  try {
    if (process.env.NODE_ENV !== 'production') {
      logger.debug('🔍 Auth Status API: Starting authentication status check...');
      logger.debug('🔍 Auth Status API: Request method:', req.method);
      logger.debug('🔍 Auth Status API: Request headers:', req.headers);
      logger.debug('🔍 Auth Status API: Request cookies:', req.cookies ? Object.keys(req.cookies) : 'None');
    }

    // Get tokens from cookies (use correct cookie names from backend)
    const authToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    logger.debug('🔍 Auth Status API: Auth token found:', authToken ? 'Yes' : 'No');
    logger.debug('🔍 Auth Status API: Auth token length:', authToken?.length || 0);
    logger.debug('🔍 Auth Status API: Refresh token found:', refreshToken ? 'Yes' : 'No');
    logger.debug('🔍 Auth Status API: BACKEND_URL:', BACKEND_URL);

    if (!authToken) {
      logger.debug('ℹ️ Auth Status API: No authentication token found - returning graceful response');
      return res.status(200).json({
        authenticated: false,
        redirectTo: '/',
        message: 'No authentication token found'
      });
    }

    logger.debug('🔍 Auth Status API: Token found, verifying with backend...');

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      logger.debug('🔍 Auth Status API: Making request to backend:', `${BACKEND_URL}/api/auth/status`);
      const response = await fetch(`${BACKEND_URL}/api/auth/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          // Forward incoming cookies so backend can validate session using cookies too
          'Cookie': req.headers.cookie || ''
        },
        signal: controller.signal,
      });

      logger.debug('🔍 Auth Status API: Fetch completed, response status:', response.status);
      logger.debug('🔍 Auth Status API: Response headers:', Object.fromEntries(response.headers.entries()));

      clearTimeout(timeoutId);
      logger.debug('🔍 Auth Status API: Backend response status:', response.status);

      if (!response.ok) {
        logger.debug(`❌ Auth Status API: Backend returned ${response.status}`);

        // Try to get error details for debugging and handle token expiry
        let errorBody: string | null = null;
        let parsedError: any = null;
        try {
          // Read the error response body and attempt to parse JSON so we can
          // detect well-known error codes such as TOKEN_EXPIRED even in
          // production. Avoid verbose logging unless not in production.
          errorBody = await response.text();
          try { parsedError = JSON.parse(errorBody); } catch (e) { parsedError = null; }
          if (process.env.NODE_ENV !== 'production') {
            logger.debug('❌ Auth Status API: Backend error response (text):', errorBody);
            logger.debug('❌ Auth Status API: Parsed backend error:', parsedError);
          }
        } catch (e) {
          if (process.env.NODE_ENV !== 'production') logger.debug('❌ Auth Status API: Could not read error response');
        }

        // If backend indicates token expired, attempt a server-side refresh using the incoming cookies
        const tokenExpired = parsedError && (parsedError.code === 'TOKEN_EXPIRED' || /expired/i.test(parsedError.error || ''));
        if (tokenExpired) {
          logger.debug('🔄 Auth Status API: Detected expired token, attempting server-side refresh');
          try {
            const refreshResp = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
              method: 'POST',
              // forward cookies so backend can read refreshToken cookie
              headers: {
                'Content-Type': 'application/json',
                'Cookie': req.headers.cookie || ''
              }
            });

            logger.debug('🔄 Auth Status API: Refresh response status:', refreshResp.status);

            // Forward any Set-Cookie headers from refresh response to the browser
            try {
              // Collect all Set-Cookie header values (handle multiple Set-Cookie headers)
              let setCookies: string[] = [];

              try {
                // @ts-ignore
                const raw = (refreshResp.headers as any).raw && (refreshResp.headers as any).raw();
                if (raw && raw['set-cookie']) setCookies = setCookies.concat(raw['set-cookie']);
              } catch (e) {
                // ignore
              }

              for (const [k, v] of refreshResp.headers.entries()) {
                if (k.toLowerCase() === 'set-cookie') setCookies.push(v);
              }

              if (setCookies.length > 0) {
                res.setHeader('Set-Cookie', setCookies as any);
                logger.debug('🔄 Auth Status API: Forwarded Set-Cookie(s) from refresh response');
              }
            } catch (e) {
              logger.debug('🔄 Auth Status API: Could not forward Set-Cookie header:', e);
            }

            if (refreshResp.ok) {
              logger.debug('🔄 Auth Status API: Refresh succeeded, retrying original auth status request');
              // Retry the original status call once
              const retryResp = await fetch(`${BACKEND_URL}/api/auth/status`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json',
                  'Cookie': req.headers.cookie || ''
                }
              });

              logger.debug('🔄 Auth Status API: Retry response status:', retryResp.status);
              if (!retryResp.ok) {
                const retryText = await retryResp.text().catch(() => null);
                logger.debug('🔄 Auth Status API: Retry failed:', retryText);
                return res.status(200).json({ authenticated: false, redirectTo: '/', message: 'Authentication check failed after refresh' });
              }

              const retryResult = await retryResp.json();
              logger.debug('🔄 Auth Status API: Retry result:', retryResult);

              if (retryResult.authenticated && retryResult.user) {
                const finalRedirect = determineRedirectPath(retryResult.user);
                return res.status(200).json({ authenticated: true, user: retryResult.user, redirectTo: finalRedirect });
              }

              return res.status(200).json({ authenticated: false, redirectTo: '/', message: 'Failed to get user profile after refresh' });
            }
          } catch (refreshErr) {
            logger.error('❌ Auth Status API: Refresh attempt failed:', refreshErr);
          }
        }

        // If backend returned non-OK and we didn't successfully refresh, return a graceful unauthenticated response
        return res.status(200).json({
          authenticated: false,
          redirectTo: '/',
          message: 'Authentication check failed'
        });
      }

      const result = await response.json();
      logger.debug('🔍 Auth Status API: Backend response:', {
        authenticated: result.authenticated,
        hasUser: !!result.user,
        userRole: result.user?.role,
        userEmail: result.user?.email,
        userIsFirstLogin: result.user?.isFirstLogin,
        redirectTo: result.redirectTo
      });

      if (result.authenticated && result.user) {
        const user = result.user;
        logger.debug('✅ Auth Status API: User authenticated successfully:', {
          email: user.email,
          role: user.role,
          isFirstLogin: user.isFirstLogin,
          profileCompleteness: user.profileCompleteness
        });

        const finalRedirect = determineRedirectPath(user);
        logger.debug('🔍 Auth Status API: Final redirect path:', finalRedirect);

        return res.status(200).json({
          authenticated: true,
          user: {
            role: user.role,
            email: user.email,
            isFirstLogin: user.isFirstLogin,
            isApprovedByAdmin: user.isApprovedByAdmin,
            profileCompleteness: user.profileCompleteness,
            hasSeenOnboardingMessage: user.hasSeenOnboardingMessage,
            userUuid: user.userUuid
          },
          redirectTo: finalRedirect
        });
      }

      logger.debug('❌ Auth Status API: Failed to get user profile from backend');
      return res.status(200).json({
        authenticated: false,
        redirectTo: '/',
        message: 'Failed to get user profile'
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        logger.error('❌ Auth Status API: Request timeout');
        return res.status(200).json({
          authenticated: false,
          redirectTo: '/',
          message: 'Request timeout. Please try again.'
        });
      }

      logger.error('❌ Auth Status API: Fetch error:', fetchError);

      // For development, add fallback mechanism
      if (process.env.NODE_ENV === 'development') {
        logger.debug('🔧 Auth Status API: Development mode - adding fallback response');
        return res.status(200).json({
          authenticated: false,
          redirectTo: '/',
          message: 'Backend connection failed. Please check if the backend is running.'
        });
      }

      // Return graceful response for any other errors
      return res.status(200).json({
        authenticated: false,
        redirectTo: '/',
        message: 'Authentication service temporarily unavailable'
      });
    }

  } catch (error: any) {
    logger.error('❌ Auth Status API: Error:', error);

    let message = 'Internal server error';

    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        message = 'Unable to connect to authentication server';
      } else if (error.message.includes('timeout')) {
        message = 'Request timeout. Please try again.';
      } else {
        message = error.message;
      }
    }

    return res.status(200).json({
      authenticated: false,
      redirectTo: '/',
      message
    });
  }
}

function determineRedirectPath(user: any): string | null {
  // Admin users go to admin dashboard
  if (user.role === 'admin') {
    return '/admin/dashboard';
  }

  // Check if user is approved by admin
  if (!user.isApprovedByAdmin) {
    return '/?error=account_paused';
  }

  // Get user flags
  const isFirstLogin = user.isFirstLogin;
  const profileCompleteness = user.profileCompleteness || 0;
  const hasSeenOnboardingMessage = user.hasSeenOnboardingMessage;
  const profileCompleted = user.profileCompleted;

  logger.debug('🔍 Auth Status - User flags:', {
    isFirstLogin,
    profileCompleteness,
    hasSeenOnboardingMessage,
    profileCompleted,
    isApprovedByAdmin: user.isApprovedByAdmin
  });

  // Access Control Logic:
  // Users should only access /dashboard and /matches if profileCompleteness is 100%

  // Case 1: First-time user (isFirstLogin = true)
  if (isFirstLogin) {
    // Always redirect to profile for first-time users
    logger.debug('🔄 First-time user - redirecting to profile');
    return '/profile';
  }

  // Case 2: Returning user with incomplete profile (profileCompleteness < 100%)
  if (profileCompleteness < 100) {
    logger.debug('🔄 Profile incomplete - redirecting to profile');
    return '/profile';
  }

  // Case 3: User with complete profile (profileCompleteness = 100%)
  // Allow access to all pages - NO REDIRECT NEEDED
  if (profileCompleteness >= 100) {
    logger.debug('✅ Profile complete - allowing access to all pages');
    return null; // No redirect needed - user can access any page
  }

  // Default case: redirect to profile (safety fallback)
  logger.debug('🔄 Default case - redirecting to profile');
  return '/profile';
}
