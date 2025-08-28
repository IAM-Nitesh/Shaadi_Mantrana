import { NextRequest, NextResponse } from 'next/server';
import logger from '../../../../utils/logger';
import { withRouteLogging } from '../../route-logger';

async function handleGet(request: NextRequest) {
  try {
    logger.debug('🔍 Token API: Starting token extraction...');
    
    // Get the authToken from cookies
    const authToken = request.cookies.get('authToken')?.value;
    
    if (!authToken) {
      logger.debug('❌ Token API: No authToken cookie found');
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    logger.debug('✅ Token API: Token found, length:', authToken.length);
    
    // Return the token for client-side use
    return NextResponse.json({
      success: true,
      token: authToken
    });

  } catch (error) {
    logger.error('❌ Token API: Error extracting token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to extract token' },
      { status: 500 }
    );
  }
}

export const GET = withRouteLogging(handleGet);