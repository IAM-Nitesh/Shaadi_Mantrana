import { NextRequest, NextResponse } from 'next/server';
import logger from '../../../../utils/logger';
import { withRouteLogging } from '../../route-logger';

async function handleGet(request: NextRequest) {
  try {
    logger.debug('🔍 Debug API: Checking cookies...');
    
    const cookies = request.cookies;
    const allCookies = cookies.getAll();
    
    logger.debug('🔍 Debug API: All cookies:', allCookies);
    
    const authToken = cookies.get('authToken')?.value;
    const refreshToken = cookies.get('refreshToken')?.value;
    const sessionId = cookies.get('sessionId')?.value;
    
    logger.debug('🔍 Debug API: Auth token present:', !!authToken);
    logger.debug('🔍 Debug API: Refresh token present:', !!refreshToken);
    logger.debug('🔍 Debug API: Session ID present:', !!sessionId);
    
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
    logger.error('❌ Debug API: Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const GET = withRouteLogging(handleGet);