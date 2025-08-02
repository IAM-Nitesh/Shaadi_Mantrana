import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug API: Checking cookies...');
    
    const cookies = request.cookies;
    const allCookies = cookies.getAll();
    
    console.log('🔍 Debug API: All cookies:', allCookies);
    
    const authToken = cookies.get('authToken')?.value;
    const refreshToken = cookies.get('refreshToken')?.value;
    const sessionId = cookies.get('sessionId')?.value;
    
    console.log('🔍 Debug API: Auth token present:', !!authToken);
    console.log('🔍 Debug API: Refresh token present:', !!refreshToken);
    console.log('🔍 Debug API: Session ID present:', !!sessionId);
    
    return NextResponse.json({
      success: true,
      cookies: {
        authToken: authToken ? 'Present' : 'Missing',
        refreshToken: refreshToken ? 'Present' : 'Missing',
        sessionId: sessionId ? 'Present' : 'Missing',
        allCookies: allCookies.map(cookie => ({
          name: cookie.name,
          value: cookie.value ? 'Present' : 'Missing'
        }))
      },
      headers: {
        authorization: request.headers.get('authorization') ? 'Present' : 'Missing',
        cookie: request.headers.get('cookie') ? 'Present' : 'Missing'
      }
    });
    
  } catch (error) {
    console.error('❌ Debug API: Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 