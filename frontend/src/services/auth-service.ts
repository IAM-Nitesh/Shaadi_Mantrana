// API configuration for different environments
export const API_CONFIG = {
  // Use environment variable or detect if we're in static mode
  USE_STATIC_DEMO: process.env.NODE_ENV === 'production' && !process.env.API_BASE_URL,
  API_BASE_URL: process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5500',
  
  // Production API endpoints - Updated to match backend routes
  SEND_OTP_ENDPOINT: '/api/auth/send-otp',
  VERIFY_OTP_ENDPOINT: '/api/auth/verify-otp',
  
  // External API endpoints (for production deployment)
  EXTERNAL_SEND_OTP: process.env.NEXT_PUBLIC_API_BASE_URL ? 
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/send-otp` : null,
  EXTERNAL_VERIFY_OTP: process.env.NEXT_PUBLIC_API_BASE_URL ? 
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/verify-otp` : null,
};

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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
        
        // Convert technical errors to user-friendly messages
        let userMessage = 'Code verification failed. Try again.';
        
        if (response.status === 429) {
          userMessage = 'Too many attempts. Wait a moment.';
        } else if (response.status === 403) {
          userMessage = 'Email not approved. Contact support.';
        } else if (response.status >= 500) {
          userMessage = 'Server issue. Try again shortly.';
        } else if (errorData.error && !errorData.error.includes('HTTP')) {
          userMessage = errorData.error;
        }
        
        throw new Error(userMessage);
      }
      
      return await response.json();
    } catch (error: any) {
      // In development, provide more specific error messages
      if (process.env.NODE_ENV === 'development') {
        console.error('AuthService.sendOTP error:', error);
        
        // If it's a network error, provide specific guidance
        if (error.message.includes('fetch')) {
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
        
        // Convert technical errors to user-friendly messages
        let userMessage = 'Invalid code. Please check and try again.';
        
        if (response.status === 400) {
          userMessage = 'Code expired or invalid. Request new one.';
        } else if (response.status === 429) {
          userMessage = 'Too many attempts. Request new code.';
        } else if (response.status === 500) {
          userMessage = 'Login service unavailable. Try again.';
        } else if (errorData.error) {
          if (errorData.error.includes('expired')) {
            userMessage = 'Code expired. Request new one.';
          } else if (errorData.error.includes('not found')) {
            userMessage = 'Invalid code. Check and try again.';
          } else if (errorData.error.includes('Failed to verify')) {
            userMessage = 'Verification failed. Try again.';
          } else if (!errorData.error.includes('HTTP')) {
            userMessage = errorData.error;
          }
        }
        
        throw new Error(userMessage);
      }
      
      return await response.json();
    } catch (error: any) {
      // In development, provide more specific error messages
      if (process.env.NODE_ENV === 'development') {
        console.error('AuthService.verifyOTP error:', error);
        
        // If it's a network error, provide specific guidance
        if (error.message.includes('fetch')) {
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
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Error during logout' };
    }
  }

  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('authToken');
  }
}
