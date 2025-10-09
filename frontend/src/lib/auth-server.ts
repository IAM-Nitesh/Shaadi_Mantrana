import { cookies } from 'next/headers';

// Server-side auth always needs absolute URLs since it's not in browser context
const API_BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:5500' : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5500');

interface User {
  userId: string;
  email: string;
  role: string;
  verified: boolean;
  userUuid?: string;
  profileCompleteness?: number;
  isFirstLogin?: boolean;
}

export async function getServerSession(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    
    // Get all auth-related cookies
    const accessToken = cookieStore.get('accessToken');
    const refreshToken = cookieStore.get('refreshToken');
    const sessionId = cookieStore.get('sessionId');
    
    if (!accessToken || !refreshToken || !sessionId) {
      console.log('🔍 getServerSession: No auth cookies found');
      return null;
    }

    console.log('🔍 getServerSession: Found auth cookies, verifying with backend...');

    // Call your backend to verify session
    const response = await fetch(`${API_BASE_URL}/api/auth/status`, {
      headers: {
        Cookie: `accessToken=${accessToken.value}; refreshToken=${refreshToken.value}; sessionId=${sessionId.value}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Important: don't cache auth checks
    });

    if (!response.ok) {
      console.log('🔍 getServerSession: Backend auth check failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data.authenticated || !data.user) {
      console.log('🔍 getServerSession: User not authenticated');
      return null;
    }

    console.log('✅ getServerSession: User authenticated:', data.user.email);
    return {
      userId: data.user.userId || data.userId || '',
      email: data.user.email || data.userEmail || '',
      role: data.user.role || data.userRole || 'user',
      verified: data.user.verified || true,
      userUuid: data.user.userUuid,
      profileCompleteness: data.user.profileCompleteness || data.profileCompleteness || 0,
      isFirstLogin: data.user.isFirstLogin || data.isFirstLogin || false,
    };
  } catch (error) {
    console.error('❌ getServerSession: Server auth check failed:', error);
    return null;
  }
}