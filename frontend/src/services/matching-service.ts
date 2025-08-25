// Matching Service - Handles discovery, likes, and matches
import { config as configService } from './configService';
import { getBearerToken, isAuthenticated } from './auth-utils';
import logger from '../utils/logger';
import { loggerForUser } from '../utils/pino-logger';
import { getCurrentUser } from './auth-utils';

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
    occupation?: string;
    images?: string | string[]; // Handle both string and array cases
    about?: string;
    education?: string;
    nativePlace?: string;
    currentResidence?: string;
    location?: string; // Add location field
    interests?: string[];
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
  connectionId?: string;
  dailyLikeCount: number;
  remainingLikes: number;
  alreadyLiked?: boolean;
  message?: string;
  shouldShowToast?: boolean;
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
    const apiBaseUrl = configService.apiBaseUrl;
    
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
      // Check if user is authenticated using server-side auth
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        // console.warn('User not authenticated, returning empty discovery data');
        return {
          profiles: [],
          dailyLimitReached: false,
          dailyLikeCount: 0,
          remainingLikes: 0
        };
      }

      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
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
          'Authorization': `Bearer ${bearerToken}`,
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
      
      // Debug: Log the raw data received from backend
      logger.debug('🔍 MatchingService: Raw backend response:', {
        profilesCount: data.profiles?.length || 0,
        firstProfile: data.profiles?.[0] ? {
          id: data.profiles[0]._id,
          name: data.profiles[0].profile?.name,
          interests: data.profiles[0].profile?.interests,
          interestsType: typeof data.profiles[0].profile?.interests,
          interestsLength: data.profiles[0].profile?.interests?.length
        } : null
      });
      
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
    const apiBaseUrl = configService.apiBaseUrl;
    
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
      // Check if user is authenticated using server-side auth
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        throw new Error('Authentication required');
      }

      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${apiBaseUrl}/api/matching/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId, type }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed, please login again');
        }
        
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        
        // Handle specific error cases more gracefully
        if (errorData.error && errorData.error.includes('Profile already liked')) {
          // Return a special response for already liked profiles
          return {
            success: true,
            isMutualMatch: false,
            dailyLikeCount: 0,
            remainingLikes: 0,
            alreadyLiked: true,
            message: 'Profile already liked'
          };
        }
        
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
    const apiBaseUrl = configService.apiBaseUrl;
    
    if (!apiBaseUrl) {
      // console.warn('API_BASE_URL not configured. Pass not recorded.');
      return { success: false, message: 'API not configured' };
    }

    try {
      // Check if user is authenticated using server-side auth
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        throw new Error('Authentication required');
      }

      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${apiBaseUrl}/api/matching/pass`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
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
    try {
      if (!isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const token = await getBearerToken();
      const response = await fetch(`${this.baseUrl}/api/matching/unmatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to unmatch profile');
      }

      // Clear matches cache after unmatch
      this.clearMatchesCache();

      return data;
    } catch (error) {
      try {
        const user = await getCurrentUser();
        const log = loggerForUser(user?.userUuid);
        log.error({ err: error }, 'Unmatch profile error:');
      } catch (e) {
        logger.error({ err: error }, 'Unmatch profile error:');
      }
      throw error;
    }
  }

  // Mark match toast as seen
  static async markMatchToastSeen(targetUserId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check authentication first
      const authenticated = await isAuthenticated();
      if (!authenticated) {
  logger.warn('User not authenticated, skipping toast seen update');
        return { success: false, message: 'User not authenticated' };
      }

      // Get Bearer token
      const token = await getBearerToken();
      if (!token) {
  logger.warn('No bearer token available, skipping toast seen update');
        return { success: false, message: 'No access token available' };
      }

      const response = await fetch(`${this.baseUrl}/api/matching/mark-toast-seen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        try {
          const user = await getCurrentUser();
          const log = loggerForUser(user?.userUuid);
          log.warn({ err: data?.error || response.statusText }, 'Failed to mark toast as seen');
        } catch (e) {
          logger.warn({ err: data?.error || response.statusText }, 'Failed to mark toast as seen');
        }
        return { success: false, message: data.error || 'Failed to mark match toast as seen' };
      }

      return data;
    } catch (error) {
      logger.error('Mark match toast seen error:', error);
      return { success: false, message: 'Failed to mark match toast as seen' };
    }
  }

  // Mark match toast as seen when entering chat
  static async markToastSeenOnChatEntry(connectionId: string): Promise<{ success: boolean; message: string }> {
    const maxRetries = 3;
    const retryDelay = 200; // 200ms delay between retries
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check authentication first
        const authenticated = await isAuthenticated();
        if (!authenticated) {
          logger.warn('User not authenticated, skipping toast seen update');
          return { success: false, message: 'User not authenticated' };
        }

        // Get Bearer token
        const token = await getBearerToken();
        if (!token) {
          logger.warn('No bearer token available, skipping toast seen update');
          return { success: false, message: 'No access token available' };
        }

        const response = await fetch(`${this.baseUrl}/api/matching/mark-toast-seen-chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ connectionId })
        });

        const data = await response.json();
        
        if (!response.ok) {
          // If it's a 404 and we have more retries, try again
          if (response.status === 404 && attempt < maxRetries) {
            logger.warn(`Attempt ${attempt}/${maxRetries}: Failed to mark toast as seen (404), retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
          
          logger.warn('Failed to mark toast as seen:', {
            status: response.status,
            statusText: response.statusText,
            error: data.error,
            data: data,
            attempt: attempt
          });
          return { success: false, message: data.error || `Failed to mark match toast as seen (${response.status})` };
        }

        return data;
      } catch (error) {
        logger.error(`Mark toast seen on chat entry error (attempt ${attempt}):`, error);
        
        // If this is the last attempt, return error
        if (attempt === maxRetries) {
          return { success: false, message: 'Failed to mark match toast as seen' };
        }
        
        // Otherwise, wait and retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    return { success: false, message: 'Failed to mark match toast as seen after all retries' };
  }

  // Get liked profiles (for Request tab)
  static async getLikedProfiles(): Promise<{
    likedProfiles: LikedProfile[];
    totalLikes: number;
    mutualMatches: number;
  }> {
    const apiBaseUrl = configService.apiBaseUrl;
    
    if (!apiBaseUrl) {
      // console.warn('API_BASE_URL not configured. No liked profiles available.');
      return {
        likedProfiles: [],
        totalLikes: 0,
        mutualMatches: 0
      };
    }

    try {
      // Check if user is authenticated using server-side auth
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        return {
          likedProfiles: [],
          totalLikes: 0,
          mutualMatches: 0
        };
      }

      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        return {
          likedProfiles: [],
          totalLikes: 0,
          mutualMatches: 0
        };
      }

      const response = await fetch(`${apiBaseUrl}/api/matching/liked`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok && response.status !== 304) {
        if (response.status === 401) {
          return {
            likedProfiles: [],
            totalLikes: 0,
            mutualMatches: 0
          };
        }
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
    const apiBaseUrl = configService.apiBaseUrl;
    
    if (!apiBaseUrl) {
      // console.warn('API_BASE_URL not configured. No mutual matches available.');
      return {
        matches: [],
        totalMatches: 0
      };
    }

    try {
      // Check if user is authenticated using server-side auth
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        return {
          matches: [],
          totalMatches: 0
        };
      }

      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        return {
          matches: [],
          totalMatches: 0
        };
      }

      const response = await fetch(`${apiBaseUrl}/api/matching/matches`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok && response.status !== 304) {
        if (response.status === 401) {
          return {
            matches: [],
            totalMatches: 0
          };
        }
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
    const apiBaseUrl = configService.apiBaseUrl;
    
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
      // Check if user is authenticated using server-side auth
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        return {
          dailyLikeCount: 0,
          canLikeToday: true,
          remainingLikes: 5,
          dailyLimit: 5
        };
      }

      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        return {
          dailyLikeCount: 0,
          canLikeToday: true,
          remainingLikes: 5,
          dailyLimit: 5
        };
      }

      const url = date 
        ? `${apiBaseUrl}/api/matching/stats?date=${date}`
        : `${apiBaseUrl}/api/matching/stats`;
        
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok && response.status !== 304) {
        if (response.status === 401) {
          return {
            dailyLikeCount: 0,
            canLikeToday: true,
            remainingLikes: 5,
            dailyLimit: 5
          };
        }
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
    logger.debug('🔍 Cache disabled for debugging');
    
    // Check cache first
    // const cached = cacheManager.get(cacheKey, 'matches');
    // if (cached) {
    //   console.log('✅ Using cached matches data');
    //   return cached;
    // }

    logger.debug('🔄 Fetching fresh matches data...');

    try {
      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        throw new Error('No authentication token found');
      }

      logger.debug('🔗 Making API calls to fetch matches and likes...');

      // Fetch both matches and likes in parallel
      const [matchesResponse, likesResponse] = await Promise.all([
        fetch(`${this.baseUrl}/api/matching/matches`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${this.baseUrl}/api/matching/liked`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      logger.debug('📡 API responses received:', {
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

      logger.debug('📊 Raw API data:', {
        matchesData,
        likesData
      });

      // Debug the structure of each response
      if (matchesData.success && matchesData.matches) {
        logger.debug('📋 Matches API response structure:', {
          success: matchesData.success,
          matchesCount: matchesData.matches.length,
          firstMatch: matchesData.matches[0],
          pagination: matchesData.pagination
        });
      } else {
        logger.debug('❌ Matches API response:', matchesData);
      }

      if (likesData.success && likesData.likedProfiles) {
        logger.debug('📋 Likes API response structure:', {
          success: likesData.success,
          likesCount: likesData.likedProfiles.length,
          firstLike: likesData.likedProfiles[0],
          pagination: likesData.pagination
        });
      } else {
        logger.debug('❌ Likes API response:', likesData);
      }
      
      // Log the exact keys in the responses
      logger.debug('🔑 Matches response keys:', Object.keys(matchesData));
      logger.debug('🔑 Likes response keys:', Object.keys(likesData));

      // Combine the data
      const combinedData = {
        success: true,
        mutualMatches: matchesData.success ? matchesData.matches.map((match: any) => {
          logger.debug('🔄 Processing match:', match);
          const transformedMatch = {
            connectionId: match.connectionId,
            profile: {
              _id: match.profile._id,
              profile: match.profile.profile
            }
          };
          logger.debug('✅ Transformed match:', transformedMatch);
          return transformedMatch;
        }) : [],
        likedProfiles: likesData.success ? likesData.likedProfiles.map((like: any) => {
          logger.debug('🔄 Processing like:', like);
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
          logger.debug('✅ Transformed like:', transformedLike);
          return transformedLike;
        }) : []
      };

      logger.debug('🎯 Combined data:', combinedData);
      
      // Test the final data structure
      logger.debug('🧪 Final data test:', {
        success: combinedData.success,
        mutualMatchesCount: combinedData.mutualMatches.length,
        likedProfilesCount: combinedData.likedProfiles.length,
        mutualMatchesSample: combinedData.mutualMatches[0],
        likedProfilesSample: combinedData.likedProfiles[0]
      });
      
      // Cache the result for 1 week
      // cacheManager.set(cacheKey, combinedData, 'matches');
      logger.debug('💾 Cached matches data');
      
      return combinedData;
    } catch (error) {
      logger.error('❌ Error fetching matches:', error);
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
      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.baseUrl}/api/chat/${connectionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
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
      logger.error('Error fetching chat messages:', error);
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