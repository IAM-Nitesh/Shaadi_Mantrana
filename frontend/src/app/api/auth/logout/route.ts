import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get('authToken')?.value;

    if (authToken) {
      // Call backend logout endpoint
      const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5500';
      await fetch(`${backendUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }).catch(() => {
        // Ignore backend errors during logout
      });
    }

    // Clear all authentication cookies
    const response = NextResponse.json({ 
      success: true, 
      message: 'Successfully logged out' 
    });

    response.cookies.delete('authToken');
    response.cookies.delete('refreshToken');
    response.cookies.delete('sessionId');

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    
    // Still clear cookies even if there's an error
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out' 
    });

    response.cookies.delete('authToken');
    response.cookies.delete('refreshToken');
    response.cookies.delete('sessionId');

    return response;
  }
} 