// Profile Service for Frontend
// This service handles fetching profiles and uses the same API config as auth service

// To configure the backend port, set NEXT_PUBLIC_API_BASE_URL in your .env file.
// Example: NEXT_PUBLIC_API_BASE_URL=http://localhost:3500 (static), 4500 (dev), 5500 (prod)
const API_CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4500',
};

export interface Profile {
  id: number;
  name: string;
  age: number;
  profession: string;
  location: string;
  education: string;
  image: string;
  interests: string[];
  about: string;
  verified: boolean;
  lastActive: string;
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
      console.warn('API_BASE_URL not configured. Using demo profiles for development.');
      return this.getDemoProfiles();
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
        throw new Error(`Failed to fetch profiles: ${response.statusText}`);
      }

      const data = await response.json();
      return data.profiles || [];
    } catch (error: unknown) {
      console.error('Error fetching profiles:', error);
      
      // Fallback to demo profiles in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Falling back to demo profiles due to API error');
        return this.getDemoProfiles();
      }
      
      throw new Error((error as Error)?.message || 'Failed to fetch profiles');
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

    try {
      const response = await fetch(`${apiBaseUrl}/api/profiles/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.statusText}`);
      }

      const data = await response.json();
      return data.profile || null;
    } catch (error: unknown) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Demo profiles for development/fallback
  private static getDemoProfiles(): Profile[] {
    console.warn('⚠️ Using demo profiles. Configure API_BASE_URL for production.');
    
    return [
      {
        id: 1,
        name: 'Priya S.',
        age: 26,
        profession: 'Software Engineer',
        location: 'Mumbai, Maharashtra',
        education: 'B.Tech Computer Science',
        image: '/demo-profiles/profile-1.svg',
        interests: ['Travel', 'Reading', 'Cooking'],
        about: 'Looking for a life partner who values family and career equally.',
        verified: true,
        lastActive: '2 hours ago'
      },
      {
        id: 2,
        name: 'Arjun P.',
        age: 29,
        profession: 'Doctor',
        location: 'Delhi, India',
        education: 'MBBS, MD',
        image: '/demo-profiles/profile-2.svg',
        interests: ['Music', 'Sports', 'Social Work'],
        about: 'Passionate doctor seeking a caring and understanding partner.',
        verified: true,
        lastActive: '1 day ago'
      },
      {
        id: 3,
        name: 'Kavya R.',
        age: 24,
        profession: 'Teacher',
        location: 'Bangalore, Karnataka',
        education: 'M.Ed English Literature',
        image: '/demo-profiles/profile-3.svg',
        interests: ['Art', 'Dance', 'Literature'],
        about: 'Creative soul looking for someone who appreciates arts and culture.',
        verified: true,
        lastActive: '3 hours ago'
      }
    ];
  }
}
