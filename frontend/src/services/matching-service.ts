// Matching Service - Handles discovery, likes, and matches
import { API_CONFIG } from './auth-service';

export interface DiscoveryProfile {
  _id: string;
  profile: {
    name: string;
    age?: number;
    profession?: string;
    images?: string[];
    about?: string;
  };
  verification?: {
    isVerified: boolean;
  };
}

export interface LikeResponse {
  success: boolean;
  like: any;
  isMutualMatch: boolean;
  connection?: any;
  dailyLikeCount: number;
  remainingLikes: number;
}

export interface DailyLikeStats {
  dailyLikeCount: number;
  canLikeToday: boolean;
  remainingLikes: number;
  dailyLimit: number;
}

export interface LikedProfile {
  likeId: string;
  profile: DiscoveryProfile;
  likeDate: string;
  type: string;
  isMutualMatch: boolean;
}

export interface MutualMatch {
  connectionId: string;
  profile: DiscoveryProfile;
  matchDate: string;
  lastActivity: string;
}

export class MatchingService {
  // Get discovery profiles (with daily limit)
  static async getDiscoveryProfiles(page: number = 1, limit: number = 10): Promise<{
    profiles: DiscoveryProfile[];
    dailyLimitReached: boolean;
    message?: string;
    dailyLikeCount: number;
    remainingLikes: number;
  }> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      console.warn('API_BASE_URL not configured. Using demo profiles.');
      return {
        profiles: [],
        dailyLimitReached: false,
        dailyLikeCount: 0,
        remainingLikes: 5
      };
    }

    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        console.warn('No auth token found, returning empty discovery data');
        return {
          profiles: [],
          dailyLimitReached: false,
          dailyLikeCount: 0,
          remainingLikes: 0
        };
      }

      const response = await fetch(`${apiBaseUrl}/api/matching/discovery?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok && response.status !== 304) {
        if (response.status === 401) {
          console.warn('Authentication failed, user may need to login again');
          // Clear invalid token
          localStorage.removeItem('authToken');
          return {
            profiles: [],
            dailyLimitReached: false,
            dailyLikeCount: 0,
            remainingLikes: 0
          };
        }
        
        // Try to get error details from response
        let errorMessage = response.statusText;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || response.statusText;
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError);
        }
        
        console.error(`Discovery API error (${response.status}):`, errorMessage);
        throw new Error(`Failed to fetch discovery profiles: ${errorMessage}`);
      }

      const data = await response.json();
      return {
        profiles: data.profiles || [],
        dailyLimitReached: data.dailyLimitReached || false,
        message: data.message,
        dailyLikeCount: data.dailyLikeCount || 0,
        remainingLikes: data.remainingLikes || 0
      };
    } catch (error) {
      console.error('Error fetching discovery profiles:', error);
      return {
        profiles: [],
        dailyLimitReached: false,
        dailyLikeCount: 0,
        remainingLikes: 0
      };
    }
  }

  // Like a profile (swipe right)
  static async likeProfile(targetUserId: string, type: 'like' | 'super_like' = 'like'): Promise<LikeResponse> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      console.warn('API_BASE_URL not configured. Demo like recorded.');
      return {
        success: true,
        like: { _id: 'demo-like' },
        isMutualMatch: false,
        dailyLikeCount: 1,
        remainingLikes: 4
      };
    }

    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${apiBaseUrl}/api/matching/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId, type }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed, please login again');
        }
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Failed to like profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error liking profile:', error);
      throw error;
    }
  }

  // Pass on a profile (swipe left)
  static async passProfile(targetUserId: string): Promise<{ success: boolean; message: string }> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      console.warn('API_BASE_URL not configured. Demo pass recorded.');
      return { success: true, message: 'Profile passed' };
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/matching/pass`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Failed to pass profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error passing profile:', error);
      throw error;
    }
  }

  // Get liked profiles (for Request tab)
  static async getLikedProfiles(): Promise<{
    likedProfiles: LikedProfile[];
    totalLikes: number;
    mutualMatches: number;
  }> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      console.warn('API_BASE_URL not configured. Using demo liked profiles.');
      return {
        likedProfiles: [],
        totalLikes: 0,
        mutualMatches: 0
      };
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/matching/liked`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok && response.status !== 304) {
        throw new Error(`Failed to fetch liked profiles: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        likedProfiles: data.likedProfiles || [],
        totalLikes: data.totalLikes || 0,
        mutualMatches: data.mutualMatches || 0
      };
    } catch (error) {
      console.error('Error fetching liked profiles:', error);
      return {
        likedProfiles: [],
        totalLikes: 0,
        mutualMatches: 0
      };
    }
  }

  // Get mutual matches (for Matches tab)
  static async getMutualMatches(): Promise<{
    matches: MutualMatch[];
    totalMatches: number;
  }> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      console.warn('API_BASE_URL not configured. Using demo mutual matches.');
      return {
        matches: [],
        totalMatches: 0
      };
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/matching/matches`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok && response.status !== 304) {
        throw new Error(`Failed to fetch mutual matches: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        matches: data.matches || [],
        totalMatches: data.totalMatches || 0
      };
    } catch (error) {
      console.error('Error fetching mutual matches:', error);
      return {
        matches: [],
        totalMatches: 0
      };
    }
  }

  // Get daily like statistics
  static async getDailyLikeStats(date?: string): Promise<DailyLikeStats> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      console.warn('API_BASE_URL not configured. Using demo stats.');
      return {
        dailyLikeCount: 0,
        canLikeToday: true,
        remainingLikes: 5,
        dailyLimit: 5
      };
    }

    try {
      const url = date 
        ? `${apiBaseUrl}/api/matching/stats?date=${date}`
        : `${apiBaseUrl}/api/matching/stats`;
        
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok && response.status !== 304) {
        throw new Error(`Failed to fetch daily like stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching daily like stats:', error);
      return {
        dailyLikeCount: 0,
        canLikeToday: true,
        remainingLikes: 5,
        dailyLimit: 5
      };
    }
  }
} 