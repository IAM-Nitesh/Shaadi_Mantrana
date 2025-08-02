import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Token API: Starting token extraction...');
    
    // Get the authToken from cookies
    const authToken = request.cookies.get('authToken')?.value;
    
    if (!authToken) {
      console.log('❌ Token API: No authToken cookie found');
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    console.log('✅ Token API: Token found, length:', authToken.length);
    
    // Return the token for client-side use
    return NextResponse.json({
      success: true,
      token: authToken
    });

  } catch (error) {
    console.error('❌ Token API: Error extracting token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to extract token' },
      { status: 500 }
    );
  }
} 