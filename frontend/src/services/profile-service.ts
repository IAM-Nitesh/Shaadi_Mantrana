// Profile Service for Frontend
// This service handles fetching profiles and uses server-side authentication

// To configure the backend port, set NEXT_PUBLIC_API_BASE_URL in your .env.development file.
// Example: NEXT_PUBLIC_API_BASE_URL=http://localhost:5500 (dev), https://your-production-domain.com (prod)
import { config } from './configService';
import { getBearerToken, isAuthenticated } from './auth-utils';
import logger from '../utils/logger';

export const API_CONFIG = {
  API_BASE_URL: config.apiBaseUrl,
};

export interface Profile {
  // Basic fields
  id?: string;
  userId?: string;
  name?: string;
  email: string;
  userUuid?: string;
  role: string;
  verified: boolean;
  lastActive: string;
  isFirstLogin?: boolean;
  hasSeenOnboardingMessage?: boolean;
  
  // Profile fields (from backend profile.profile)
  gender?: string;
  nativePlace?: string;
  currentResidence?: string;
  maritalStatus?: string;
  manglik?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  height?: string;
  weight?: string;
  complexion?: string;
  education?: string;
  occupation?: string;
  annualIncome?: string;
  eatingHabit?: string;
  smokingHabit?: string;
  drinkingHabit?: string;
  father?: string;
  mother?: string;
  brothers?: string;
  sisters?: string;
  fatherGotra?: string;
  motherGotra?: string;
  grandfatherGotra?: string;
  grandmotherGotra?: string;
  specificRequirements?: string;
  settleAbroad?: string;
  about?: string;
  interests?: string[];
  profileCompleteness?: number;
  
  // Legacy fields for backward compatibility
  age?: number;
  profession?: string;
  location?: string;
  image?: string;
  images?: string;
  
  // Profile object from backend
  profile?: {
    images?: string;
    [key: string]: any;
  };
}

export interface FilterCriteria {
  ageRange: [number, number];
  selectedProfessions: string[];
  selectedLocations: string[];
  selectedEducation: string[];
  selectedInterests: string[];
}

export class ProfileService {
  // Fetch profiles based on filters and user preferences
  static async getProfiles(filters: FilterCriteria, page: number = 1, limit: number = 10): Promise<Profile[]> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      // console.warn('API_BASE_URL not configured. Returning empty array.');
      return [];
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ageMin: filters.ageRange[0].toString(),
        ageMax: filters.ageRange[1].toString(),
        professions: filters.selectedProfessions.join(','),
        locations: filters.selectedLocations.join(','),
        education: filters.selectedEducation.join(','),
        interests: filters.selectedInterests.join(','),
      });

      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        return [];
      }

      const response = await fetch(`${apiBaseUrl}/api/profiles?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No profiles found, return empty array
          return [];
        }
        throw new Error(`Failed to fetch profiles: ${response.statusText}`);
      }

      const data = await response.json();
      return data.profiles || [];
    } catch (error: unknown) {
      // console.error('Error fetching profiles:', error);
      // Return empty array on error
      return [];
    }
  }

  // Record user interaction (like/dislike)
  static async recordInteraction(profileId: number, action: 'like' | 'dislike'): Promise<boolean> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
          // console.log(`API not configured: ${action} not recorded for profile ${profileId}`);
    return false;
    }

    try {
      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        return false;
      }

      const response = await fetch(`${apiBaseUrl}/api/interactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId,
          action,
          timestamp: new Date().toISOString(),
        }),
      });

      return response.ok;
    } catch (error: unknown) {
      // console.error('Error recording interaction:', error);
      return false;
    }
  }

  // Get user's profile
  static async getUserProfile(): Promise<Profile | null> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      // console.warn('API_BASE_URL not configured. No profile available.');
      return null;
    }

    // Check if user is authenticated using server-side auth
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      // console.log('🔐 User not authenticated, returning null');
      return null;
    }

    try {
      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        return null;
      }

      const response = await fetch(`${apiBaseUrl}/api/profiles/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok && response.status !== 304) {
        if (response.status === 401) {
          // console.warn('Authentication failed, user may need to login again');
          return null;
        }
        if (response.status === 404) {
          // console.log('Profile not found, returning null');
          return null;
        }
        // For other errors, log but don't throw
        // console.error(`Profile fetch failed with status ${response.status}: ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      // console.log('🔍 Backend profile response:', data);
      
      // The backend returns profile data nested under data.profile.profile
      // We need to flatten this structure for the frontend
      if (data.profile && data.profile.profile) {
        const flattenedProfile = {
          ...data.profile.profile, // All the profile fields (name, gender, etc.)
          email: data.profile.email,
          userUuid: data.profile.userUuid,
          isFirstLogin: data.profile.isFirstLogin,
          hasSeenOnboardingMessage: data.profile.hasSeenOnboardingMessage,
          // Add any other top-level fields that might be needed
          id: data.profile.userId?.toString(),
          role: 'user', // Default role
          verified: data.profile.verification?.isVerified || false,
          lastActive: data.profile.lastActive || new Date().toISOString(),
          // Preserve the profileCompleteness field from the nested structure
          profileCompleteness: data.profile.profile.profileCompleteness
        };
        logger.debug('🔍 Flattened profile for onboarding check:', {
          isFirstLogin: flattenedProfile.isFirstLogin,
          hasSeenOnboardingMessage: flattenedProfile.hasSeenOnboardingMessage,
          profileCompleteness: flattenedProfile.profileCompleteness
        });
        return flattenedProfile;
      }
      
      return data.profile ? { 
        ...data.profile, 
        email: data.profile.email, 
        role: 'user', 
        isFirstLogin: data.profile.isFirstLogin,
        hasSeenOnboardingMessage: data.profile.hasSeenOnboardingMessage
      } : null;
    } catch (error: unknown) {
      // console.error('Error fetching user profile:', error);
      // Don't throw, just return null for graceful handling
      return null;
    }
  }

  // Get user profile by UUID (public)
  static async getProfileByUuid(uuid: string): Promise<Profile | null> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    if (!apiBaseUrl) return null;
    try {
      const response = await fetch(`${apiBaseUrl}/api/profiles/uuid/${uuid}`);
      if (!response.ok) throw new Error('Failed to fetch profile by UUID');
      const data = await response.json();
      return data.profile || null;
    } catch (error) {
      // console.error('Error fetching profile by UUID:', error);
      return null;
    }
  }

  // Soft delete (deactivate) user profile
  static async deleteProfile(): Promise<boolean> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    if (!apiBaseUrl) return false;
    
    // Check if user is authenticated using server-side auth
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return false;
    }
    
    try {
      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        return false;
      }

      const response = await fetch(`${apiBaseUrl}/api/profiles/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      // console.error('Error deleting profile:', error);
      return false;
    }
  }

  // DEPRECATED: These methods are now handled by ServerAuthService
  // Use ServerAuthService.canAccessRestrictedFeatures(), ServerAuthService.needsProfileCompletion(), etc.
  // Keeping these for backward compatibility but they should not be used in new code

  // Calculate profile completion for real-time feedback (frontend calculation)
  static calculateProfileCompletion(profile: any): number {
    if (!profile) return 0;

    const requiredFields = [
      'name', 'gender', 'dateOfBirth', 'height', 'weight', 'complexion',
      'education', 'occupation', 'annualIncome', 'nativePlace', 'currentResidence',
      'maritalStatus', 'father', 'mother', 'about', 'images'
    ];

    const optionalFields = [
      'timeOfBirth', 'placeOfBirth', 'manglik', 'eatingHabit', 'smokingHabit', 
      'drinkingHabit', 'brothers', 'sisters', 'fatherGotra', 'motherGotra',
      'grandfatherGotra', 'grandmotherGotra', 'specificRequirements', 'settleAbroad',
      'interests'
    ];

    let completedFields = 0;

    // Check required fields (weight: 2x)
    requiredFields.forEach(field => {
      if (profile[field] && profile[field].toString().trim() !== '') {
        completedFields += 2;
      }
    });

    // Check optional fields (weight: 1x)
    optionalFields.forEach(field => {
      if (profile[field] && profile[field].toString().trim() !== '') {
        completedFields += 1;
      }
    });

    // Calculate percentage (max 100%)
    const percentage = Math.min(100, Math.round((completedFields / (requiredFields.length * 2 + optionalFields.length)) * 100));
    return percentage;
  }

  // DEPRECATED: Profile completion is now handled by the backend
  // This method is kept for backward compatibility but should not be used
  static updateProfileCompleteness(profile: any): void {
    logger.debug('⚠️ ProfileService.updateProfileCompleteness is deprecated. Profile completion is now handled by the backend.');
  }

  // Update onboarding message flag in backend
  static async updateOnboardingMessage(hasSeenOnboardingMessage: boolean): Promise<boolean> {
    try {
      // Check if user is authenticated using server-side auth
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        logger.error('❌ User not authenticated for updating onboarding message');
        return false;
      }

      const apiUrl = API_CONFIG.API_BASE_URL + '/api/profiles/me/onboarding';
      
      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        return false;
      }

      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hasSeenOnboardingMessage })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        logger.error('❌ Failed to update onboarding message:', errorData);
        return false;
      }

      const result = await response.json();
      if (result.success) {
        logger.debug('✅ Onboarding message flag updated successfully:', hasSeenOnboardingMessage);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('❌ Error updating onboarding message:', error);
      return false;
    }
  }

  // Force authentication refresh after profile updates
  static async forceAuthRefresh(): Promise<void> {
    try {
      logger.debug('🔄 ProfileService: Forcing authentication refresh...');
      
      // Clear any cached authentication data
      if (typeof window !== 'undefined') {
        // Clear any localStorage cache if needed
        localStorage.removeItem('authCache');
      }
      
      // Trigger a fresh authentication check
      const response = await fetch('/api/auth/status', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        logger.debug('✅ ProfileService: Authentication refresh successful');
      } else {
        logger.warn('⚠️ ProfileService: Authentication refresh failed');
      }
    } catch (error) {
      logger.error('❌ ProfileService: Error forcing auth refresh:', error);
    }
  }

  // Update user profile
  static async updateProfile(profileData: any): Promise<any> {
    try {
      // Check if user is authenticated using server-side auth
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        logger.error('❌ User not authenticated for updating profile');
        return { success: false, error: 'Not authenticated' };
      }

      const apiUrl = API_CONFIG.API_BASE_URL + '/api/profiles/me';
      
      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        return { success: false, error: 'No bearer token' };
      }

      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        logger.error('❌ Failed to update profile:', errorData);
        return { success: false, error: errorData };
      }

      const result = await response.json();
      logger.debug('✅ Profile updated successfully');
      return { success: true, data: result };
    } catch (error) {
      logger.error('❌ Error updating profile:', error);
      return { success: false, error };
    }
  }

  // Update profile with forced authentication refresh
  static async updateProfileWithRefresh(profileData: any): Promise<any> {
    try {
      logger.debug('🔄 ProfileService: Updating profile with refresh...');
      
      // Update profile
      const result = await ProfileService.updateProfile(profileData);
      
      if (result.success) {
        // Force authentication refresh to get latest user data
        await ProfileService.forceAuthRefresh();
      }
      
      return result;
    } catch (error) {
      logger.error('❌ ProfileService: Error updating profile with refresh:', error);
      throw error;
    }
  }
}
