import { config as configService } from '../services/configService';
import logger from './logger';
import { setLastRequestId } from './request-context';

// Track if a refresh is currently in progress to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Track ongoing requests to prevent duplicates
const ongoingRequests = new Map<string, Promise<any>>();

// Global lock to prevent multiple concurrent auth requests
let authRequestLock = false;
let authRequestPromise: Promise<any> | null = null;

// Function to deduplicate requests with better error handling and timeout management
async function deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  // If there's already an ongoing request for this key, return the existing promise
  if (ongoingRequests.has(key)) {
    logger.debug(`🔄 ApiClient: Deduplicating request for ${key} (${ongoingRequests.size} ongoing requests: ${Array.from(ongoingRequests.keys()).join(', ')})`);
    return ongoingRequests.get(key)!;
  }

  logger.debug(`🔄 ApiClient: Starting new request for ${key} (${ongoingRequests.size} ongoing requests: ${Array.from(ongoingRequests.keys()).join(', ')})`);

  // Create a new request and store it
  const requestPromise = requestFn()
    .then((result) => {
      logger.debug(`✅ ApiClient: Request ${key} completed successfully`);
      return result;
    })
    .catch((error) => {
      logger.error(`❌ ApiClient: Request ${key} failed:`, error);
      throw error;
    })
    .finally(() => {
      // Clean up the request when it completes
      ongoingRequests.delete(key);
      logger.debug(`🧹 ApiClient: Cleaned up request ${key} (${ongoingRequests.size} remaining: ${Array.from(ongoingRequests.keys()).join(', ')})`);
    });

  ongoingRequests.set(key, requestPromise);
  return requestPromise;
}

// Function to clear all ongoing requests (for debugging)
function clearOngoingRequests() {
  logger.debug(`🧹 ApiClient: Clearing ${ongoingRequests.size} ongoing requests`);
  ongoingRequests.clear();
}

// Function to get ongoing requests count (for debugging)
function getOngoingRequestsCount(): number {
  return ongoingRequests.size;
}

// Function to refresh token
async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      logger.debug('🔄 ApiClient: Attempting token refresh...');
      
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (refreshResponse.ok) {
        const result = await refreshResponse.json();
        if (result.success) {
          logger.debug('✅ ApiClient: Token refresh successful');
          return true;
        }
      }
      
      logger.warn('⚠️ ApiClient: Token refresh failed');
      return false;
    } catch (error) {
      logger.error('❌ ApiClient: Token refresh error:', error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Simple UUID v4 generator fallback if crypto.randomUUID not available (browser older env)
function generateRequestId(): string {
  try {
    // Prefer native crypto.randomUUID where available
    // @ts-ignore
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      // @ts-ignore
      return crypto.randomUUID();
    }
  } catch (_) { /* ignore */ }
  // Fallback to RFC4122-ish random
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// API Client configuration
interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

// Request options interface
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
  timeout?: number;
  retries?: number;
}

// Response wrapper
interface ApiResponse<T = any> {
  data: T;
  status: number;
  ok: boolean;
  headers: Headers;
  requestId?: string | null;
}

class ApiClient {
  private config: ApiClientConfig;

  constructor() {
    this.config = {
      baseUrl: configService.apiBaseUrl,
      timeout: 8000, // Default timeout
      retries: 2, // Reduce retries
      retryDelay: 1000 // 1 second
    };
  }

  // Adaptive timeout based on endpoint type for better performance
  private getAdaptiveTimeout(endpoint: string, method: string): number {
    // Auth status checks - increased timeout for better reliability
    if (endpoint.includes('/auth/status')) {
      return 8000; // 8 seconds for status checks (increased from 3s)
    }
    // Other auth endpoints
    if (endpoint.includes('/auth/')) {
      return 5000; // 5 seconds for auth operations
    }
    // Upload endpoints need more time
    if (endpoint.includes('/upload/') || method === 'POST' || method === 'PATCH') {
      return 15000; // 15 seconds for uploads and data modifications
    }
    // Chat and real-time features
    if (endpoint.includes('/chat/') || endpoint.includes('/websocket/')) {
      return 10000; // 10 seconds for real-time features
    }
    // Default for other endpoints
    return 8000;
  }

  /**
   * Make a fetch request with CORS configuration and retry logic
   */
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      credentials = 'include',
      signal,
      timeout = this.getAdaptiveTimeout(endpoint, method || 'GET'), // Use adaptive timeout
      retries = this.config.retries
    } = options;

    // Create a unique key for request deduplication
    // For auth requests, use a more specific key to ensure proper deduplication
    const requestKey = endpoint.includes('/auth/') 
      ? `auth:${method}:${endpoint}` // Include method for auth requests to be more specific
      : `${method}:${endpoint}`;
    
    // For all auth requests, use global lock to prevent multiple concurrent requests
    if (endpoint.includes('/auth/')) {
      logger.debug(`🔍 ApiClient: Making auth request to ${endpoint} with key ${requestKey}`);
      
      // Use global lock for all auth requests
      if (authRequestLock && authRequestPromise) {
        logger.debug(`🔒 ApiClient: Auth request already in progress, waiting for completion`);
        return authRequestPromise;
      }
      
      // Set lock and create new request
      authRequestLock = true;
      authRequestPromise = deduplicateRequest(requestKey, () => this.performRequest<T>(endpoint, options))
        .finally(() => {
          authRequestLock = false;
          authRequestPromise = null;
          logger.debug(`🔓 ApiClient: Auth request lock released`);
        });
      
      return authRequestPromise;
    }
    
    return this.performRequest<T>(endpoint, options);
  }

  private async performRequest<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      credentials = 'include',
      signal,
      timeout = this.getAdaptiveTimeout(endpoint, method || 'GET'), // Use adaptive timeout
      retries = this.config.retries
    } = options;

    // Build the full URL
    // Always use the configured base URL when available
    let url: string;
    const configuredBase = this.config.baseUrl?.replace(/\/$/, '');

    if (/^https?:\/\//i.test(endpoint)) {
      // Endpoint is already a full URL, use it as-is
      url = endpoint;
    } else if (configuredBase) {
      // We have a configured base URL, prepend it to relative endpoints
      url = `${configuredBase}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    } else {
      // No base URL configured, use endpoint as-is (same-origin)
      url = endpoint;
    }
    
    // Create timeout signal with better browser compatibility
    let timeoutSignal: AbortSignal;
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      // Try modern AbortSignal.timeout first
      timeoutSignal = AbortSignal.timeout(timeout);
    } catch (e) {
      // Fallback for older browsers
      const controller = new AbortController();
      timeoutSignal = controller.signal;
      timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);
    }
    
    // Combine signals if both are provided
    let combinedSignal: AbortSignal;
    try {
      combinedSignal = signal 
        ? (AbortSignal.any ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal)
        : timeoutSignal;
    } catch (e) {
      // Fallback if AbortSignal.any is not supported
      combinedSignal = signal || timeoutSignal;
    }

    // Default headers with CORS support and cache control for auth endpoints
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      // Add cache control for auth endpoints to prevent stale responses
      ...(endpoint.includes('auth') ? {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      } : {}),
      ...headers
    };

    // Correlation headers: ensure a request id exists; reuse if caller provided.
    if (!defaultHeaders['X-Request-ID'] && !defaultHeaders['x-request-id']) {
      defaultHeaders['X-Request-ID'] = generateRequestId();
    } else if (defaultHeaders['x-request-id'] && !defaultHeaders['X-Request-ID']) {
      // Normalize case
      defaultHeaders['X-Request-ID'] = defaultHeaders['x-request-id'];
      delete defaultHeaders['x-request-id'];
    }

    // Attempt to attach user uuid if globally available (SSR-safe guard)
    try {
      // Allow explicit header override.
      const hasUserHeader = !!(defaultHeaders['X-User-UUID'] || defaultHeaders['x-user-uuid']);
      if (!hasUserHeader) {
        const globalAny: any = (typeof window !== 'undefined') ? (window as any) : {};
        const candidate = globalAny.CURRENT_USER_UUID || globalAny.currentUserUuid;
        if (candidate && typeof candidate === 'string') {
          defaultHeaders['X-User-UUID'] = candidate;
        }
      } else if (defaultHeaders['x-user-uuid'] && !defaultHeaders['X-User-UUID']) {
        defaultHeaders['X-User-UUID'] = defaultHeaders['x-user-uuid'];
        delete defaultHeaders['x-user-uuid'];
      }
    } catch (_) { /* ignore user uuid */ }

    // Remove Content-Type if no body or if it's FormData
    if (!body || body instanceof FormData) {
      delete defaultHeaders['Content-Type'];
    }

    const requestConfig: RequestInit = {
      method,
      headers: defaultHeaders,
      credentials,
      signal: combinedSignal,
      mode: 'cors',
      // Prevent caching for auth endpoints to avoid stale token issues
      cache: endpoint.includes('auth') ? 'no-store' : 'default'
    };

    // Add body if provided
    if (body) {
      if (body instanceof FormData) {
        requestConfig.body = body;
      } else {
        requestConfig.body = JSON.stringify(body);
      }
    }

    // Reduced logging for better performance - only essential info
    logger.debug(`🌐 API Client: ${method} ${endpoint}`, {
      timeout: `${timeout}ms`,
      finalUrl: url !== endpoint ? url : undefined
    });

    // Retry logic
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const startTime = Date.now();
        const response = await fetch(url, requestConfig);
        const duration = Date.now() - startTime;
        
        logger.debug(`✅ API Client: ${method} ${endpoint} completed`, {
          status: response.status,
          duration: `${duration}ms`
        });
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : this.config.retryDelay;
          
          logger.warn(`⏳ API Client: Rate limited, waiting ${waitTime}ms before retry ${attempt}/${retries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // Handle 503 Service Unavailable (database issues)
        if (response.status === 503) {
          logger.warn(`📊 API Client: Service unavailable (possible database issue), retrying ${attempt}/${retries}`);
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
            continue;
          }
        }

        // Handle 401 Unauthorized - attempt token refresh and retry once
        if (response.status === 401 && attempt === 1 && !url.includes('/auth/refresh')) {
          logger.warn('🔐 ApiClient: 401 Unauthorized, attempting token refresh...');
          
          const refreshSuccess = await refreshAccessToken();
          if (refreshSuccess) {
            logger.debug('🔄 ApiClient: Token refreshed, retrying original request...');
            // Retry the original request with refreshed token
            continue;
          } else {
            logger.warn('⚠️ ApiClient: Token refresh failed, redirecting to login');
            // Token refresh failed, redirect to login
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
            throw new Error('Authentication failed');
          }
        }

        // Handle server errors with retry
        if (response.status >= 500 && attempt < retries) {
          logger.warn(`🔄 API Client: Server error ${response.status}, retrying ${attempt}/${retries}`);
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
          continue;
        }

        // Parse response
        let data: T;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text() as T;
        }

        const responseRequestId = response.headers.get('x-request-id');
        if (responseRequestId) {
          setLastRequestId(responseRequestId);
        }

        // Clean up timeout if we created one manually
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        return {
          data,
          status: response.status,
          ok: response.ok,
          headers: response.headers,
          requestId: responseRequestId
        };

      } catch (error) {
        lastError = error as Error;
        
        // Clean up timeout if we created one manually
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        // Don't retry on abort/timeout
        if (error instanceof Error && (error.name === 'AbortError' || error.message?.includes('aborted'))) {
          logger.error(`⏰ API Client: Request timeout for ${endpoint} after ${timeout}ms`);
          throw new Error(`Request timeout after ${timeout}ms`);
        }
        
        // Handle network errors
        if (error instanceof Error && error.message?.includes('Failed to fetch')) {
          logger.error(`🌐 API Client: Network error for ${endpoint}:`, error.message);
          throw new Error('Network error. Please check your connection.');
        }
        
        // Handle database connection errors from backend
        if (error instanceof Error && error.message?.includes('Database')) {
          logger.error(`📊 API Client: Database error for ${endpoint}:`, error.message);
          throw new Error('Database temporarily unavailable. Please try again in a moment.');
        }

        // Don't retry on network errors if it's the last attempt
        if (attempt === retries) {
          logger.error(`❌ API Client: Final attempt failed for ${url}:`, error);
          throw error;
        }

        logger.warn(`🔄 API Client: Attempt ${attempt}/${retries} failed for ${url}:`, error);
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  /**
   * Upload file with FormData
   */
  async upload<T = any>(endpoint: string, formData: FormData, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it with boundary
        ...options?.headers
      }
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export debugging functions for development
export { clearOngoingRequests, getOngoingRequestsCount };

// Export types for use in other files
export type { ApiResponse, RequestOptions };
