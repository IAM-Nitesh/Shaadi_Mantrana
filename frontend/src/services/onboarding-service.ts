// Onboarding Service - Manages user onboarding experience and flags
import { config as configService } from './configService';
import { getBearerToken, isAuthenticated } from './auth-utils';
import logger from '../utils/logger';
import { getUserCompleteness } from '../utils/user-utils';

export interface OnboardingFlags {
  isFirstLogin: boolean;
  hasSeenOnboardingMessage: boolean;
  profileCompleted: boolean;
  profileCompleteness: number;
}

export class OnboardingService {
  private static baseUrl = configService.apiBaseUrl;

  /**
   * Update onboarding message flag
   */
  static async updateOnboardingFlag(hasSeenOnboardingMessage: boolean): Promise<any> {
    try {
      // Check if user is authenticated
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        throw new Error('No authentication token found');
      }

      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.baseUrl}/api/profiles/onboarding-flag`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hasSeenOnboardingMessage }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error updating onboarding flag:', error);
      throw error;
    }
  }

  /**
   * Update first login flag
   */
  static async updateFirstLoginFlag(isFirstLogin: boolean): Promise<any> {
    try {
      // Check if user is authenticated
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        throw new Error('No authentication token found');
      }

      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.baseUrl}/api/profiles/first-login-flag`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFirstLogin }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error updating first login flag:', error);
      throw error;
    }
  }

  /**
   * Mark onboarding message as seen
   */
  static async markOnboardingMessageSeen(): Promise<any> {
    return await this.updateOnboardingFlag(true);
  }

  /**
   * Mark user as not first login (after profile completion)
   */
  static async markProfileCompleted(): Promise<any> {
    return await this.updateFirstLoginFlag(false);
  }

  /**
   * Check if user should see onboarding message
   */
  static shouldShowOnboardingMessage(user: any): boolean {
    if (!user) return false;
    
    // Show onboarding message only if:
    // 1. User is first login AND
    // 2. Hasn't seen onboarding message yet AND
    // 3. Profile is not complete
  const completeness = getUserCompleteness(user);
  return user.isFirstLogin && 
       !user.hasSeenOnboardingMessage && 
       completeness < 100;
  }

  /**
   * Check if user can access restricted features
   */
  static canAccessRestrictedFeatures(user: any): boolean {
    if (!user) return false;
    
    // Access Control Logic: Only allow access if profileCompleteness is 100%
  const completeness = getUserCompleteness(user);
  return completeness >= 100;
  }

  /**
   * Get appropriate redirect path based on user state
   */
  static getRedirectPath(user: any): string | null {
    if (!user) return '/';

    // Admin users go to admin dashboard
    if (user.role === 'admin') {
      return '/admin/dashboard';
    }

    // Check if user is approved by admin
    if (!user.isApprovedByAdmin) {
      return '/?error=account_paused';
    }

    // Access Control Logic: Only allow access if profileCompleteness is 100%
    
    // Case 1: First-time user (isFirstLogin = true)
    if (user.isFirstLogin) {
      return '/profile';
    }

    // Case 2: Returning user with incomplete profile (profileCompleteness < 100%)
  const completeness = getUserCompleteness(user);
  if (completeness < 100) {
      return '/profile';
    }

    // Case 3: User with complete profile (profileCompleteness = 100%)
    // Allow access to all pages - NO REDIRECT NEEDED
  const completeness2 = getUserCompleteness(user);
  if (completeness2 >= 100) {
      return null; // No redirect needed - user can access any page
    }

    // Default case: redirect to profile (safety fallback)
    return '/profile';
  }
}
