import { NextRequest, NextResponse } from 'next/server';
import logger from '../../../../utils/logger';
import { config as configService } from '../../../../services/configService';
import { withRouteLogging } from '../../route-logger';

async function handleGet(request: NextRequest) {
  try {
    logger.debug('🔍 Auth Status API: Starting authentication status check...');
    
    const authToken = request.cookies.get('authToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;
    
    logger.debug('🔍 Auth Status API: Auth token found:', authToken ? 'Yes' : 'No');
    logger.debug('🔍 Auth Status API: Auth token length:', authToken?.length || 0);
    logger.debug('🔍 Auth Status API: Auth token preview:', authToken ? `${authToken.substring(0, 20)}...` : 'None');
    logger.debug('🔍 Auth Status API: Refresh token found:', refreshToken ? 'Yes' : 'No');

    if (!authToken) {
      logger.debug('ℹ️ Auth Status API: No authentication token found - returning graceful response');
      return NextResponse.json(
        { 
          authenticated: false, 
          redirectTo: '/',
          message: 'No authentication token found' 
        },
        { status: 200 } // Changed from 401 to 200 to prevent blocking
      );
    }

    logger.debug('🔍 Auth Status API: Token found, verifying with backend...');

    // Verify token with backend
    const backendUrl = configService.apiBaseUrl;
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      logger.debug('🔍 Auth Status API: Making request to backend:', `${backendUrl}/api/auth/profile`);
      logger.debug('🔍 Auth Status API: Authorization header:', `Bearer ${authToken.substring(0, 20)}...`);
      logger.debug('🔍 Auth Status API: Full backend URL:', `${backendUrl}/api/auth/profile`);
      logger.debug('🔍 Auth Status API: Environment check:', {
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
        backendUrl,
        authTokenLength: authToken.length
      });
      
      const response = await fetch(`${backendUrl}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      logger.debug('🔍 Auth Status API: Backend response status:', response.status);
      logger.debug('🔍 Auth Status API: Backend response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        logger.debug(`❌ Auth Status API: Backend returned ${response.status}`);
        
        // Try to get error details
        try {
          const errorData = await response.text();
          logger.debug('❌ Auth Status API: Backend error response:', errorData);
        } catch (e) {
          logger.debug('❌ Auth Status API: Could not read error response');
        }
        
        // If it's a 401 error and we have a refresh token, try to refresh
        if (response.status === 401 && refreshToken) {
          logger.debug('🔄 Auth Status API: Token expired, attempting refresh...');
          
          try {
            const refreshResponse = await fetch(`${backendUrl}/api/auth/refresh`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refreshToken }),
              signal: AbortSignal.timeout(5000), // 5 second timeout for refresh
            });

            if (refreshResponse.ok) {
              const refreshResult = await refreshResponse.json();
              logger.debug('✅ Auth Status API: Token refresh successful');
              
              // Set new cookies with the refreshed tokens
              const successResponse = NextResponse.json({
                authenticated: true,
                user: refreshResult.user || null,
                redirectTo: refreshResult.user ? determineRedirectPath(refreshResult.user) : '/'
              });

              // Set new auth token cookie
              if (refreshResult.accessToken) {
                successResponse.cookies.set('authToken', refreshResult.accessToken, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
                  maxAge: 60 * 60 * 24 * 7, // 7 days
                  path: '/'
                });
              }

              // Set new refresh token cookie if provided
              if (refreshResult.refreshToken) {
                successResponse.cookies.set('refreshToken', refreshResult.refreshToken, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
                  maxAge: 60 * 60 * 24 * 30, // 30 days
                  path: '/'
                });
              }

              return successResponse;
            } else {
              logger.debug('❌ Auth Status API: Token refresh failed, status:', refreshResponse.status);
            }
          } catch (refreshError) {
            logger.error('❌ Auth Status API: Token refresh error:', refreshError);
          }
        }
        
        // Clear invalid cookies and return graceful response
        const errorResponse = NextResponse.json(
          { 
            authenticated: false, 
            redirectTo: '/',
            message: 'Invalid or expired token' 
          },
          { status: 200 } // Changed from 401 to 200 to prevent blocking
        );

        errorResponse.cookies.delete('authToken');
        errorResponse.cookies.delete('refreshToken');
        errorResponse.cookies.delete('sessionId');

        return errorResponse;
      }

      const result = await response.json();
      logger.debug('🔍 Auth Status API: Backend response:', result);

      if (result.success && result.user) {
        const user = result.user;
        logger.debug('✅ Auth Status API: User authenticated successfully:', {
          email: user.email,
          role: user.role,
          isFirstLogin: user.isFirstLogin,
          profileCompleteness: user.profileCompleteness
        });
        
        return NextResponse.json({
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
          redirectTo: determineRedirectPath(user)
        });
      }

      logger.debug('❌ Auth Status API: Failed to get user profile from backend');
      return NextResponse.json(
        { 
          authenticated: false, 
          redirectTo: '/',
          message: 'Failed to get user profile' 
        },
        { status: 200 } // Changed from 401 to 200 to prevent blocking
      );

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        logger.error('❌ Auth Status API: Request timeout');
        return NextResponse.json(
          { 
            authenticated: false, 
            redirectTo: '/',
            message: 'Request timeout. Please try again.' 
          },
          { status: 200 } // Changed from 408 to 200 to prevent blocking
        );
      }
      
      logger.error('❌ Auth Status API: Fetch error:', fetchError);
      
      // For development, let's add a fallback mechanism
      if (process.env.NODE_ENV === 'development') {
        logger.debug('🔧 Auth Status API: Development mode - adding fallback response');
        return NextResponse.json(
          { 
            authenticated: false, 
            redirectTo: '/',
            message: 'Backend connection failed. Please check if the backend is running.' 
          },
          { status: 200 } // Changed from 503 to 200 to prevent blocking
        );
      }
      
      // Return graceful response for any other errors
      return NextResponse.json(
        { 
          authenticated: false, 
          redirectTo: '/',
          message: 'Authentication service temporarily unavailable' 
        },
        { status: 200 } // Changed from throwing error to returning 200
      );
    }

  } catch (error) {
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
    
    return NextResponse.json(
      { 
        authenticated: false, 
        redirectTo: '/',
        message 
      },
      { status: 200 } // Changed from 500 to 200 to prevent blocking
    );
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

export const GET = withRouteLogging(handleGet);