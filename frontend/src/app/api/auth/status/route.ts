import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Auth Status API: Starting authentication status check...');
    
    const authToken = request.cookies.get('authToken')?.value;
    console.log('🔍 Auth Status API: Auth token found:', authToken ? 'Yes' : 'No');
    console.log('🔍 Auth Status API: Auth token length:', authToken?.length || 0);
    console.log('🔍 Auth Status API: Auth token preview:', authToken ? `${authToken.substring(0, 20)}...` : 'None');

    if (!authToken) {
      console.log('❌ Auth Status API: No authentication token found');
      return NextResponse.json(
        { 
          authenticated: false, 
          redirectTo: '/',
          message: 'No authentication token found' 
        },
        { status: 401 }
      );
    }

    console.log('🔍 Auth Status API: Token found, verifying with backend...');

    // Verify token with backend
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5500';
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      console.log('🔍 Auth Status API: Making request to backend:', `${backendUrl}/api/auth/profile`);
      console.log('🔍 Auth Status API: Authorization header:', `Bearer ${authToken.substring(0, 20)}...`);
      console.log('🔍 Auth Status API: Full backend URL:', `${backendUrl}/api/auth/profile`);
      console.log('🔍 Auth Status API: Environment check:', {
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
      console.log('🔍 Auth Status API: Backend response status:', response.status);
      console.log('🔍 Auth Status API: Backend response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.log(`❌ Auth Status API: Backend returned ${response.status}`);
        
        // Try to get error details
        try {
          const errorData = await response.text();
          console.log('❌ Auth Status API: Backend error response:', errorData);
        } catch (e) {
          console.log('❌ Auth Status API: Could not read error response');
        }
        
        // For debugging, let's try to parse the error response as JSON
        try {
          const errorJson = await response.json();
          console.log('❌ Auth Status API: Backend error JSON:', errorJson);
        } catch (e) {
          console.log('❌ Auth Status API: Could not parse error as JSON');
        }
        
        // Clear invalid cookies
        const errorResponse = NextResponse.json(
          { 
            authenticated: false, 
            redirectTo: '/',
            message: 'Invalid or expired token' 
          },
          { status: 401 }
        );

        errorResponse.cookies.delete('authToken');
        errorResponse.cookies.delete('refreshToken');
        errorResponse.cookies.delete('sessionId');

        return errorResponse;
      }

      const result = await response.json();
      console.log('🔍 Auth Status API: Backend response:', result);

      if (result.success && result.user) {
        const user = result.user;
        console.log('✅ Auth Status API: User authenticated successfully:', {
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

      console.log('❌ Auth Status API: Failed to get user profile from backend');
      return NextResponse.json(
        { 
          authenticated: false, 
          redirectTo: '/',
          message: 'Failed to get user profile' 
        },
        { status: 401 }
      );

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('❌ Auth Status API: Request timeout');
        return NextResponse.json(
          { 
            authenticated: false, 
            redirectTo: '/',
            message: 'Request timeout. Please try again.' 
          },
          { status: 408 }
        );
      }
      
      console.error('❌ Auth Status API: Fetch error:', fetchError);
      
      // For development, let's add a fallback mechanism
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Auth Status API: Development mode - adding fallback response');
        return NextResponse.json(
          { 
            authenticated: false, 
            redirectTo: '/',
            message: 'Backend connection failed. Please check if the backend is running.' 
          },
          { status: 503 }
        );
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('❌ Auth Status API: Error:', error);
    
    let message = 'Internal server error';
    let status = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        message = 'Unable to connect to authentication server';
        status = 503;
      } else if (error.message.includes('timeout')) {
        message = 'Request timeout. Please try again.';
        status = 408;
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
      { status }
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

  // Check profile completion and first login status
  const isFirstLogin = user.isFirstLogin;
  const profileCompleteness = user.profileCompleteness || 0;
  const hasSeenOnboardingMessage = user.hasSeenOnboardingMessage;

  // Case 1: isFirstLogin = true, isApprovedByAdmin = true, profileCompleteness < 100
  if (isFirstLogin && profileCompleteness < 100) {
    return '/profile';
  }

  // Case 2: isFirstLogin = false, isApprovedByAdmin = true, profileCompleteness < 100
  if (!isFirstLogin && profileCompleteness < 100) {
    return '/profile';
  }

  // Case 3: isFirstLogin = false, isApprovedByAdmin = true, profileCompleteness = 100
  if (!isFirstLogin && profileCompleteness >= 100) {
    return '/dashboard';
  }

  // Default case: redirect to dashboard
  return '/dashboard';
} 