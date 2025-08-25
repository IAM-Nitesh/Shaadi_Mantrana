import { NextRequest, NextResponse } from 'next/server';
import logger from '../../../../utils/logger';
import { withRouteLogging } from '../../route-logger';

async function handlePost(request: NextRequest) {
  try {
    
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Call the backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5500';
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`${backendUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: result.error || 'Authentication failed' },
          { status: response.status }
        );
      }

      if (result.success && result.session) {
        // Set HTTP-only cookies for security
        const response = NextResponse.json({
          success: true,
          user: result.user,
          redirectTo: determineRedirectPath(result.user)
        });

        // Build cookie options and avoid forcing domain in non-production
        const baseCookieOpts = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          path: '/',
        };

        response.cookies.set('authToken', result.session.accessToken, {
          ...baseCookieOpts,
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        response.cookies.set('refreshToken', result.session.refreshToken, {
          ...baseCookieOpts,
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        response.cookies.set('sessionId', result.session.sessionId, {
          ...baseCookieOpts,
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;
      }

      return NextResponse.json(
        { success: false, error: 'Authentication failed - no session returned' },
        { status: 401 }
      );

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { success: false, error: 'Request timeout. Please try again.' },
          { status: 408 }
        );
      }
      
      throw fetchError;
    }

  } catch (error) {
    logger.error('❌ Auth Verify API: Error:', error);
    
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to authentication server';
        statusCode = 503;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again.';
        statusCode = 408;
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Invalid request format';
        statusCode = 400;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
}

function determineRedirectPath(user: any): string {
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

  // Access Control Logic:
  // Users should only access /dashboard and /matches if profileCompleteness is 100%
  
  // Case 1: First-time user (isFirstLogin = true)
  if (isFirstLogin) {
    // Always redirect to profile for first-time users
    return '/profile';
  }

  // Case 2: Returning user with incomplete profile (profileCompleteness < 100%)
  if (profileCompleteness < 100) {
    return '/profile';
  }

  // Case 3: User with complete profile (profileCompleteness = 100%)
  // Allow access to all pages - NO REDIRECT NEEDED
  if (profileCompleteness >= 100) {
    // No forced redirect is required; return dashboard as a safe explicit path
    return '/dashboard';
  }

  // Default case: redirect to profile (safety fallback)
  return '/profile';
}

export const POST = withRouteLogging(handlePost);