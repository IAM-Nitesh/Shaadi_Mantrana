import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Token Refresh API: Starting token refresh...');
    
    const authToken = request.cookies.get('authToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;
    
    if (!authToken) {
      console.log('❌ Token Refresh API: No authToken cookie found');
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    if (!refreshToken) {
      console.log('❌ Token Refresh API: No refreshToken cookie found');
      return NextResponse.json(
        { success: false, error: 'No refresh token found' },
        { status: 401 }
      );
    }

    console.log('🔍 Token Refresh API: Tokens found, attempting refresh...');

    // Attempt to refresh token with backend
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5500';
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`${backendUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('🔍 Token Refresh API: Backend response status:', response.status);

      if (!response.ok) {
        console.log(`❌ Token Refresh API: Backend returned ${response.status}`);
        
        // Try to get error details
        try {
          const errorData = await response.text();
          console.log('❌ Token Refresh API: Backend error response:', errorData);
        } catch (e) {
          console.log('❌ Token Refresh API: Could not read error response');
        }
        
        // Clear invalid cookies
        const errorResponse = NextResponse.json(
          { success: false, error: 'Token refresh failed' },
          { status: 401 }
        );

        errorResponse.cookies.delete('authToken');
        errorResponse.cookies.delete('refreshToken');
        errorResponse.cookies.delete('sessionId');

        return errorResponse;
      }

      const result = await response.json();
      console.log('✅ Token Refresh API: Token refresh successful');

      // Set new cookies with the refreshed tokens
      const successResponse = NextResponse.json({
        success: true,
        message: 'Token refreshed successfully'
      });

      // Set new auth token cookie
      if (result.accessToken) {
        successResponse.cookies.set('authToken', result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/'
        });
      }

      // Set new refresh token cookie if provided
      if (result.refreshToken) {
        successResponse.cookies.set('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/'
        });
      }

      return successResponse;

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('❌ Token Refresh API: Request timeout');
        return NextResponse.json(
          { success: false, error: 'Request timeout' },
          { status: 408 }
        );
      }
      
      console.error('❌ Token Refresh API: Fetch error:', fetchError);
      throw fetchError;
    }

  } catch (error) {
    console.error('❌ Token Refresh API: Error:', error);
    
    let message = 'Internal server error';
    let status = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        message = 'Unable to connect to authentication server';
        status = 503;
      } else if (error.message.includes('timeout')) {
        message = 'Request timeout';
        status = 408;
      } else {
        message = error.message;
      }
    }
    
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
} 