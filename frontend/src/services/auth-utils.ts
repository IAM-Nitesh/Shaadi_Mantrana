// Authentication Utilities for Service Files
// This file contains only utility functions that can be safely imported by service files
// without breaking Fast Refresh in React components

// Local type definitions to avoid importing from server-auth-service
interface AuthUser {
  role: string;
  email: string;
  isFirstLogin: boolean;
  isApprovedByAdmin: boolean;
  profileCompleteness: number;
  hasSeenOnboardingMessage: boolean;
  userUuid: string;
}

interface AuthStatus {
  authenticated: boolean;
  user?: AuthUser;
  redirectTo: string;
  message?: string;
}

// Get Bearer token for backend API calls
export async function getBearerToken(): Promise<string | null> {
  try {
    console.log('🔍 AuthUtils: Getting Bearer token...');
    
    // Since we're using HTTP-only cookies, we need to make a server request
    // to get the token from the server side
    const response = await fetch('/api/auth/token', {
      method: 'GET',
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('❌ AuthUtils: Failed to get Bearer token, status:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.success && data.token) {
      console.log('✅ AuthUtils: Bearer token retrieved successfully');
      return data.token;
    }

    console.log('❌ AuthUtils: No token in response');
    return null;
  } catch (error) {
    console.error('❌ AuthUtils: Error getting Bearer token:', error);
    return null;
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/status', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.authenticated === true;
  } catch (error) {
    console.error('❌ AuthUtils: Error checking authentication:', error);
    return false;
  }
}

// Get current user info
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch('/api/auth/status', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('❌ AuthUtils: Error getting current user:', error);
    return null;
  }
}

// Check if user is admin
export function isAdmin(user?: AuthUser): boolean {
  return user?.role === 'admin';
}

// Check if user can access restricted features
export function canAccessRestrictedFeatures(user?: AuthUser): boolean {
  return user?.isApprovedByAdmin === true && user?.profileCompleteness === 100;
}

// Check if user needs profile completion
export function needsProfileCompletion(user?: AuthUser): boolean {
  return !user || user.profileCompleteness < 100;
} 