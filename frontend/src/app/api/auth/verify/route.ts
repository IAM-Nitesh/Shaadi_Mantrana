import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Auth Verify API: Starting OTP verification...');
    
    const { email, otp } = await request.json();

    if (!email || !otp) {
      console.log('❌ Auth Verify API: Missing email or OTP');
      return NextResponse.json(
        { success: false, error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    console.log('🔍 Auth Verify API: Calling backend for verification...');

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
        console.log(`❌ Auth Verify API: Backend returned ${response.status}:`, result.error);
        return NextResponse.json(
          { success: false, error: result.error || 'Authentication failed' },
          { status: response.status }
        );
      }

      if (result.success && result.session) {
        console.log('✅ Auth Verify API: Authentication successful, setting cookies...');
        
        // Set HTTP-only cookies for security
        const response = NextResponse.json({
          success: true,
          user: result.user,
          redirectTo: determineRedirectPath(result.user)
        });

        // Set secure, HTTP-only cookies
        response.cookies.set('authToken', result.session.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
          domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
        });

        response.cookies.set('refreshToken', result.session.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/',
          domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
        });

        response.cookies.set('sessionId', result.session.sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
          domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
        });

        console.log('✅ Auth Verify API: Cookies set successfully');
        console.log('🔍 Auth Verify API: Cookie details:', {
          authToken: result.session.accessToken ? 'Set' : 'Not set',
          refreshToken: result.session.refreshToken ? 'Set' : 'Not set',
          sessionId: result.session.sessionId ? 'Set' : 'Not set'
        });
        return response;
      }

      console.log('❌ Auth Verify API: Authentication failed - no session returned');
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('❌ Auth Verify API: Request timeout');
        return NextResponse.json(
          { success: false, error: 'Request timeout. Please try again.' },
          { status: 408 }
        );
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('❌ Auth Verify API: Error:', error);
    
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

  // Check profile completion and first login status
  const isFirstLogin = user.isFirstLogin;
  const profileCompleteness = user.profileCompleteness || 0;

  // Case 1: First login or incomplete profile
  if (isFirstLogin || profileCompleteness < 100) {
    return '/profile';
  }

  // Case 3: Complete profile - go to dashboard
  return '/dashboard';
} 