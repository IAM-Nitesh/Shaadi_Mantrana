// Profile Service for Frontend
// This service handles fetching profiles and uses the same API config as auth service

// To configure the backend port, set NEXT_PUBLIC_API_BASE_URL in your .env file.
// Example: NEXT_PUBLIC_API_BASE_URL=http://localhost:3500 (static), 4500 (dev), 5500 (prod)
const API_CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4500',
};

export interface Profile {
  // Basic fields
  id?: string;
  name?: string;
  email: string;
  userUuid?: string;
  role: string;
  verified: boolean;
  lastActive: string;
  isFirstLogin?: boolean;
  
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
  
  // Legacy fields for backward compatibility
  age?: number;
  profession?: string;
  location?: string;
  image?: string;
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
      console.warn('API_BASE_URL not configured. Returning empty array.');
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

      const response = await fetch(`${apiBaseUrl}/api/profiles?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
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
      console.error('Error fetching profiles:', error);
      // Return empty array on error
      return [];
    }
  }

  // Record user interaction (like/dislike)
  static async recordInteraction(profileId: number, action: 'like' | 'dislike'): Promise<boolean> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      console.log(`Demo mode: ${action} recorded for profile ${profileId}`);
      return true;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/interactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
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
      console.error('Error recording interaction:', error);
      return false;
    }
  }

  // Get user's profile
  static async getUserProfile(): Promise<Profile | null> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      console.warn('API_BASE_URL not configured. Using demo profile for development.');
      return null;
    }

    // Check if user is authenticated
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.log('🔐 No auth token found, returning null for unauthenticated user');
      return null;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/profiles/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok && response.status !== 304) {
        if (response.status === 401) {
          console.warn('Authentication failed, user may need to login again');
          return null;
        }
        if (response.status === 404) {
          console.log('Profile not found, returning null');
          return null;
        }
        // For other errors, log but don't throw
        console.error(`Profile fetch failed with status ${response.status}: ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      console.log('🔍 Backend profile response:', data);
      
      if (data.profile && typeof window !== 'undefined') {
        // Store isFirstLogin in localStorage for onboarding/navigation logic
        localStorage.setItem('isFirstLogin', String(data.profile.isFirstLogin));
      }
      
      // The backend returns profile data nested under data.profile.profile
      // We need to flatten this structure for the frontend
      if (data.profile && data.profile.profile) {
        const flattenedProfile = {
          ...data.profile.profile, // All the profile fields (name, gender, etc.)
          email: data.profile.email,
          userUuid: data.profile.userUuid,
          isFirstLogin: data.profile.isFirstLogin,
          // Add any other top-level fields that might be needed
          id: data.profile.userId?.toString(),
          role: 'user', // Default role
          verified: data.profile.verification?.isVerified || false,
          lastActive: data.profile.lastActive || new Date().toISOString()
        };
        console.log('🔍 Flattened profile:', flattenedProfile);
        return flattenedProfile;
      }
      
      return data.profile ? { ...data.profile, email: data.profile.email, role: 'user', isFirstLogin: data.profile.isFirstLogin } : null;
    } catch (error: unknown) {
      console.error('Error fetching user profile:', error);
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
      console.error('Error fetching profile by UUID:', error);
      return null;
    }
  }

  // Soft delete (deactivate) user profile
  static async deleteProfile(): Promise<boolean> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    if (!apiBaseUrl) return false;
    try {
      const response = await fetch(`${apiBaseUrl}/api/profiles/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting profile:', error);
      return false;
    }
  }

  // Demo profiles for development/fallback
  private static getDemoProfiles(): Profile[] {
    console.warn('⚠️ Using demo profiles. Configure API_BASE_URL for production.');
    
    return [
      {
        id: '1',
        name: 'Priya S.',
        age: 26,
        profession: 'Software Engineer',
        location: 'Mumbai, Maharashtra',
        education: 'B.Tech Computer Science',
        image: '/demo-profiles/profile-1.svg',
        interests: ['Travel', 'Reading', 'Cooking'],
        about: 'Looking for a life partner who values family and career equally.',
        verified: true,
        lastActive: '2 hours ago',
        email: 'priya@example.com',
        role: 'user'
      },
      {
        id: '2',
        name: 'Arjun P.',
        age: 29,
        profession: 'Doctor',
        location: 'Delhi, India',
        education: 'MBBS, MD',
        image: '/demo-profiles/profile-2.svg',
        interests: ['Music', 'Sports', 'Social Work'],
        about: 'Passionate doctor seeking a caring and understanding partner.',
        verified: true,
        lastActive: '1 day ago',
        email: 'arjun@example.com',
        role: 'user'
      },
      {
        id: '3',
        name: 'Kavya R.',
        age: 24,
        profession: 'Teacher',
        location: 'Bangalore, Karnataka',
        education: 'M.Ed English Literature',
        image: '/demo-profiles/profile-3.svg',
        interests: ['Art', 'Dance', 'Literature'],
        about: 'Creative soul looking for someone who appreciates arts and culture.',
        verified: true,
        lastActive: '3 hours ago',
        email: 'kavya@example.com',
        role: 'user'
      }
    ];
  }
}
