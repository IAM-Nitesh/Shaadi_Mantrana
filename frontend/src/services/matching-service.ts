// Matching Service - Handles discovery, likes, and matches
import { API_CONFIG } from './auth-service';
import configService from './configService';

// Cache configuration
const CACHE_CONFIG = {
  MATCHES: {
    RETENTION: 7 * 24 * 60 * 60 * 1000, // 1 week in milliseconds
    MAX_SIZE: 100, // Maximum number of cached items
    CLEANUP_INTERVAL: 30 * 60 * 1000, // 30 minutes
  },
  CHATS: {
    RETENTION: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    MAX_SIZE: 50, // Maximum number of cached items
    CLEANUP_INTERVAL: 15 * 60 * 1000, // 15 minutes
  }
};

// Cache storage with memory management
class CacheManager {
  private matchesCache = new Map<string, { data: any; timestamp: number; size: number }>();
  private chatsCache = new Map<string, { data: any; timestamp: number; size: number }>();
  private cleanupTimers: { [key: string]: NodeJS.Timeout } = {};

  constructor() {
    this.initializeCleanup();
  }

  private initializeCleanup() {
    // Cleanup matches cache every 30 minutes
    this.cleanupTimers.matches = setInterval(() => {
      this.cleanupCache('matches');
    }, CACHE_CONFIG.MATCHES.CLEANUP_INTERVAL);

    // Cleanup chats cache every 15 minutes
    this.cleanupTimers.chats = setInterval(() => {
      this.cleanupCache('chats');
    }, CACHE_CONFIG.CHATS.CLEANUP_INTERVAL);

    // Cleanup on page visibility change to save memory
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.cleanupCache('matches');
          this.cleanupCache('chats');
        }
      });
    }
  }

  private cleanupCache(type: 'matches' | 'chats') {
    const config = type === 'matches' ? CACHE_CONFIG.MATCHES : CACHE_CONFIG.CHATS;
    const cache = type === 'matches' ? this.matchesCache : this.chatsCache;
    const now = Date.now();

    // Remove expired items
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > config.RETENTION) {
        cache.delete(key);
      }
    }

    // If cache is still too large, remove oldest items
    if (cache.size > config.MAX_SIZE) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const itemsToRemove = entries.slice(0, cache.size - config.MAX_SIZE);
      itemsToRemove.forEach(([key]) => cache.delete(key));
    }
  }

  private estimateSize(data: any): number {
    // Simple size estimation for memory management
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size;
  }

  set(key: string, data: any, type: 'matches' | 'chats') {
    const config = type === 'matches' ? CACHE_CONFIG.MATCHES : CACHE_CONFIG.CHATS;
    const cache = type === 'matches' ? this.matchesCache : this.chatsCache;
    
    const size = this.estimateSize(data);
    cache.set(key, {
      data,
      timestamp: Date.now(),
      size
    });

    // Cleanup if cache is too large
    if (cache.size > config.MAX_SIZE) {
      this.cleanupCache(type);
    }
  }

  get(key: string, type: 'matches' | 'chats'): any | null {
    const config = type === 'matches' ? CACHE_CONFIG.MATCHES : CACHE_CONFIG.CHATS;
    const cache = type === 'matches' ? this.matchesCache : this.chatsCache;
    
    const item = cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > config.RETENTION) {
      cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string, type: 'matches' | 'chats'): boolean {
    return this.get(key, type) !== null;
  }

  clear(type?: 'matches' | 'chats') {
    if (type) {
      if (type === 'matches') {
        this.matchesCache.clear();
      } else {
        this.chatsCache.clear();
      }
    } else {
      this.matchesCache.clear();
      this.chatsCache.clear();
    }
  }

  getStats() {
    return {
      matches: {
        size: this.matchesCache.size,
        memory: Array.from(this.matchesCache.values()).reduce((sum, item) => sum + item.size, 0)
      },
      chats: {
        size: this.chatsCache.size,
        memory: Array.from(this.chatsCache.values()).reduce((sum, item) => sum + item.size, 0)
      }
    };
  }

  destroy() {
    // Clear all timers
    Object.values(this.cleanupTimers).forEach(timer => clearInterval(timer));
    this.clear();
  }
}

// Global cache instance
const cacheManager = new CacheManager();

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
  like?: any;
  error?: string;
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
  connectionId?: string;
}

export interface MutualMatch {
  connectionId: string;
  profile: DiscoveryProfile;
  matchDate: string;
  lastActivity: string;
}

export class MatchingService {
  private static baseUrl = configService.apiBaseUrl;

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
      // console.warn('API_BASE_URL not configured. No profiles available.');
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
        // console.warn('No auth token found, returning empty discovery data');
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
          // console.warn('Authentication failed, user may need to login again');
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
          // console.warn('Could not parse error response:', parseError);
        }
        
        // console.error(`Discovery API error (${response.status}):`, errorMessage);
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
      // console.error('Error fetching discovery profiles:', error);
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
      // console.warn('API_BASE_URL not configured. Like not recorded.');
      return {
        success: false,
        error: 'API not configured',
        isMutualMatch: false,
        dailyLikeCount: 0,
        remainingLikes: 0
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
      // console.error('Error liking profile:', error);
      throw error;
    }
  }

  // Pass on a profile (swipe left)
  static async passProfile(targetUserId: string): Promise<{ success: boolean; message: string }> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      // console.warn('API_BASE_URL not configured. Pass not recorded.');
      return { success: false, message: 'API not configured' };
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
      // console.error('Error passing profile:', error);
      throw error;
    }
  }

  // Unmatch from a profile
  static async unmatchProfile(targetUserId: string): Promise<{ success: boolean; message: string }> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      // console.warn('API_BASE_URL not configured. Unmatch not recorded.');
      return { success: false, message: 'API not configured' };
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/matching/unmatch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Failed to unmatch profile');
      }

      return await response.json();
    } catch (error) {
      // console.error('Error unmatching profile:', error);
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
      // console.warn('API_BASE_URL not configured. No liked profiles available.');
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
      // console.error('Error fetching liked profiles:', error);
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
      // console.warn('API_BASE_URL not configured. No mutual matches available.');
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
      // console.error('Error fetching mutual matches:', error);
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
      // console.warn('API_BASE_URL not configured. No stats available.');
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
      // console.error('Error fetching daily like stats:', error);
      return {
        dailyLikeCount: 0,
        canLikeToday: true,
        remainingLikes: 5,
        dailyLimit: 5
      };
    }
  }

  /**
   * Get matches with caching for 1 week
   */
  static async getMatches(): Promise<any> {
    const cacheKey = 'matches';
    
    // Temporarily disable cache for debugging
    console.log('🔍 Cache disabled for debugging');
    
    // Check cache first
    // const cached = cacheManager.get(cacheKey, 'matches');
    // if (cached) {
    //   console.log('✅ Using cached matches data');
    //   return cached;
    // }

    console.log('🔄 Fetching fresh matches data...');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🔗 Making API calls to fetch matches and likes...');

      // Fetch both matches and likes in parallel
      const [matchesResponse, likesResponse] = await Promise.all([
        fetch(`${this.baseUrl}/api/matching/matches`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${this.baseUrl}/api/matching/liked`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      console.log('📡 API responses received:', {
        matchesStatus: matchesResponse.status,
        likesStatus: likesResponse.status
      });

      if (!matchesResponse.ok || !likesResponse.ok) {
        throw new Error(`HTTP error! status: ${matchesResponse.status} / ${likesResponse.status}`);
      }

      const [matchesData, likesData] = await Promise.all([
        matchesResponse.json(),
        likesResponse.json()
      ]);

      console.log('📊 Raw API data:', {
        matchesData,
        likesData
      });

      // Debug the structure of each response
      if (matchesData.success && matchesData.matches) {
        console.log('📋 Matches API response structure:', {
          success: matchesData.success,
          matchesCount: matchesData.matches.length,
          firstMatch: matchesData.matches[0],
          pagination: matchesData.pagination
        });
      } else {
        console.log('❌ Matches API response:', matchesData);
      }

      if (likesData.success && likesData.likedProfiles) {
        console.log('📋 Likes API response structure:', {
          success: likesData.success,
          likesCount: likesData.likedProfiles.length,
          firstLike: likesData.likedProfiles[0],
          pagination: likesData.pagination
        });
      } else {
        console.log('❌ Likes API response:', likesData);
      }
      
      // Log the exact keys in the responses
      console.log('🔑 Matches response keys:', Object.keys(matchesData));
      console.log('🔑 Likes response keys:', Object.keys(likesData));

      // Combine the data
      const combinedData = {
        success: true,
        mutualMatches: matchesData.success ? matchesData.matches.map((match: any) => {
          console.log('🔄 Processing match:', match);
          const transformedMatch = {
            connectionId: match.connectionId,
            profile: {
              _id: match.profile._id,
              profile: match.profile.profile
            }
          };
          console.log('✅ Transformed match:', transformedMatch);
          return transformedMatch;
        }) : [],
        likedProfiles: likesData.success ? likesData.likedProfiles.map((like: any) => {
          console.log('🔄 Processing like:', like);
          const transformedLike = {
            likeId: like.likeId,
            likeDate: like.likeDate,
            type: like.type,
            isMutualMatch: like.isMutualMatch,
            connectionId: like.connectionId,
            profile: {
              _id: like.profile._id,
              profile: like.profile.profile
            }
          };
          console.log('✅ Transformed like:', transformedLike);
          return transformedLike;
        }) : []
      };

      console.log('🎯 Combined data:', combinedData);
      
      // Test the final data structure
      console.log('🧪 Final data test:', {
        success: combinedData.success,
        mutualMatchesCount: combinedData.mutualMatches.length,
        likedProfilesCount: combinedData.likedProfiles.length,
        mutualMatchesSample: combinedData.mutualMatches[0],
        likedProfilesSample: combinedData.likedProfiles[0]
      });
      
      // Cache the result for 1 week
      // cacheManager.set(cacheKey, combinedData, 'matches');
      console.log('💾 Cached matches data');
      
      return combinedData;
    } catch (error) {
      console.error('❌ Error fetching matches:', error);
      throw error;
    }
  }

  /**
   * Get chat messages with caching for 1 day
   */
  static async getChatMessages(connectionId: string): Promise<any> {
    const cacheKey = `chat_${connectionId}`;
    
    // Check cache first
    const cached = cacheManager.get(cacheKey, 'chats');
    if (cached) {
      return cached;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.baseUrl}/api/chat/${connectionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the result for 1 day
      cacheManager.set(cacheKey, data, 'chats');
      
      return data;
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      throw error;
    }
  }

  /**
   * Clear cache for specific chat when new message is sent
   */
  static clearChatCache(connectionId: string) {
    cacheManager.clear('chats');
  }

  /**
   * Clear matches cache when new match is created
   */
  static clearMatchesCache() {
    cacheManager.clear('matches');
  }

  /**
   * Get cache statistics for monitoring
   */
  static getCacheStats() {
    return cacheManager.getStats();
  }

  /**
   * Force cleanup of expired cache items
   */
  static cleanupCache() {
    // Trigger cleanup by accessing cache and checking expiration
    const matchesKeys = Array.from(cacheManager['matchesCache'].keys());
    const chatsKeys = Array.from(cacheManager['chatsCache'].keys());
    
    matchesKeys.forEach(key => {
      cacheManager.get(key, 'matches');
    });
    
    chatsKeys.forEach(key => {
      cacheManager.get(key, 'chats');
    });
  }
} 