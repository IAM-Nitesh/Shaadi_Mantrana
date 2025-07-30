// To configure the backend port, set NEXT_PUBLIC_API_BASE_URL in your .env file.
// Example: NEXT_PUBLIC_API_BASE_URL=http://localhost:4500 (dev), https://your-production-domain.com (prod)
export const API_CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4500',
  SEND_OTP_ENDPOINT: '/api/auth/send-otp',
  VERIFY_OTP_ENDPOINT: '/api/auth/verify-otp',
  EXTERNAL_SEND_OTP: process.env.NEXT_PUBLIC_API_BASE_URL ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/send-otp` : null,
  EXTERNAL_VERIFY_OTP: process.env.NEXT_PUBLIC_API_BASE_URL ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/verify-otp` : null,
};

// Helper function to create user-friendly error messages
function createUserFriendlyError(response: Response, errorData: any, context: 'sendOTP' | 'verifyOTP'): string {
  let userFriendlyMessage = errorData.error || 'Authentication failed';
  
  switch (response.status) {
    case 400:
      userFriendlyMessage = errorData.error || (context === 'sendOTP' ? 'Invalid email format. Please check and try again.' : 'Invalid OTP. Please check and try again.');
      break;
    case 401:
      userFriendlyMessage = 'Authentication failed. Please try again.';
      break;
    case 403:
      userFriendlyMessage = errorData.error || 'This email is not authorized. Please contact support.';
      break;
    case 404:
      userFriendlyMessage = 'Service not found. Please try again later.';
      break;
    case 409:
      userFriendlyMessage = errorData.error || 'This email is already registered. Please try logging in.';
      break;
    case 429:
      userFriendlyMessage = 'Too many attempts. Please wait a moment and try again.';
      break;
    case 500:
      userFriendlyMessage = 'Server error. Please try again later.';
      break;
    default:
      userFriendlyMessage = errorData.error || 'Something went wrong. Please try again.';
  }
  
  return userFriendlyMessage;
}

// Production-ready API service
export class AuthService {
  static async sendOTP(email: string) {
    // Use external API if configured
    if (API_CONFIG.EXTERNAL_SEND_OTP) {
      const response = await fetch(API_CONFIG.EXTERNAL_SEND_OTP, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY || ''}`,
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        const userFriendlyMessage = createUserFriendlyError(response, errorData, 'sendOTP');
        throw new Error(userFriendlyMessage);
      }
      
      return await response.json();
    }
    
    // Fallback to backend API routes
    try {
      const apiUrl = API_CONFIG.API_BASE_URL + API_CONFIG.SEND_OTP_ENDPOINT;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        const userFriendlyMessage = createUserFriendlyError(response, errorData, 'sendOTP');
        throw new Error(userFriendlyMessage);
      }
      
      return await response.json();
    } catch (error: unknown) {
      // In development, provide more specific error messages
      if (process.env.NODE_ENV === 'development') {
        // console.error('AuthService.sendOTP error:', error);
        
        // If it's a network error, provide specific guidance
        if (error instanceof Error && error.message.includes('fetch')) {
          throw new Error('Network error: Cannot connect to API. Make sure the development server is running.');
        }
        
        // Re-throw the original error for debugging
        throw error;
      }
      
      // If API routes don't work (static export), throw meaningful error
      throw new Error('Authentication service unavailable. Please use a server deployment for full functionality.');
    }
  }
  
  static async verifyOTP(email: string, otp: string) {
    // Use external API if configured
    if (API_CONFIG.EXTERNAL_VERIFY_OTP) {
      const response = await fetch(API_CONFIG.EXTERNAL_VERIFY_OTP, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY || ''}`,
        },
        body: JSON.stringify({ email, otp }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        const userFriendlyMessage = createUserFriendlyError(response, errorData, 'verifyOTP');
        throw new Error(userFriendlyMessage);
      }
      
      return await response.json();
    }
    
    // Fallback to backend API routes
    try {
      const apiUrl = API_CONFIG.API_BASE_URL + API_CONFIG.VERIFY_OTP_ENDPOINT;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        const userFriendlyMessage = createUserFriendlyError(response, errorData, 'verifyOTP');
        throw new Error(userFriendlyMessage);
      }
      
      const result = await response.json();
      
      // Store authentication token if verification successful
      if (result.success && result.session) {
        localStorage.setItem('authToken', result.session.accessToken);
        localStorage.setItem('refreshToken', result.session.refreshToken);
        localStorage.setItem('sessionId', result.session.sessionId);
        localStorage.setItem('userEmail', email);
        
        // Store user role if available in response
        if (result.user && result.user.role) {
          localStorage.setItem('userRole', result.user.role);
        }
      }
      
      return result;
    } catch (error: unknown) {
      // In development, provide more specific error messages
      if (process.env.NODE_ENV === 'development') {
        // console.error('AuthService.verifyOTP error:', error);
        
        // If it's a network error, provide specific guidance
        if (error instanceof Error && error.message.includes('fetch')) {
          throw new Error('Network error: Cannot connect to API. Make sure the development server is running.');
        }
        
        // Re-throw the original error for debugging
        throw error;
      }
      
      // If API routes don't work (static export), throw meaningful error
      throw new Error('Authentication service unavailable. Please use a server deployment for full functionality.');
    }
  }

  static logout() {
    try {
      // Clear authentication data
      localStorage.removeItem('authToken');
      
      // Clear all user data
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear any cookies (if we add them later)
      if (typeof document !== 'undefined') {
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
      
      return { success: true, message: 'Successfully logged out' };
    } catch (error: unknown) {
      // console.error('Logout error:', error);
      return { success: false, message: 'Error during logout' };
    }
  }

  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('authToken');
  }

  static getCurrentUserEmail(): string {
    try {
      return localStorage.getItem('userEmail') || '';
    } catch (error) {
      // console.error('Error getting current user email:', error);
      return '';
    }
  }

  static getCurrentUserRole(): string {
    try {
      return localStorage.getItem('userRole') || 'user';
    } catch (error) {
      // console.error('Error getting current user role:', error);
      return 'user';
    }
  }

  static isAdmin(): boolean {
    try {
      const userRole = localStorage.getItem('userRole');
      return userRole === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  static async verifyAdminAccess(): Promise<boolean> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('🔍 verifyAdminAccess: No auth token found');
        return false;
      }

      const apiUrl = API_CONFIG.API_BASE_URL + '/api/auth/profile';
      console.log('🔍 verifyAdminAccess: Fetching profile from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.log('🔍 verifyAdminAccess: API call failed, status:', response.status);
        // Fallback to localStorage role if API call fails
        return this.isAdmin();
      }
      
      const userData = await response.json();
      console.log('🔍 verifyAdminAccess: User data from API:', userData);
      
      const isAdminFromAPI = userData.user?.role === 'admin';
      console.log('🔍 verifyAdminAccess: Role from API:', userData.user?.role, 'Is admin:', isAdminFromAPI);
      
      // Update localStorage role to keep it in sync
      localStorage.setItem('userRole', isAdminFromAPI ? 'admin' : 'user');
      console.log('🔍 verifyAdminAccess: Updated localStorage userRole to:', isAdminFromAPI ? 'admin' : 'user');
      
      return isAdminFromAPI;
    } catch (error) {
      console.error('Error verifying admin access:', error);
      // Fallback to localStorage role
      return this.isAdmin();
    }
  }

  static getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }
}
