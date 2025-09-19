import { config as configService } from '../services/configService';
import logger from './logger';
import { setLastRequestId } from './request-context';

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
      timeout: 10000, // 10 seconds
      retries: 3,
      retryDelay: 1000 // 1 second
    };
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
      timeout = this.config.timeout,
      retries = this.config.retries
    } = options;

    // Normalize endpoint to allow same-origin proxying.
    // If the caller passes a full URL that matches configured baseUrl, rewrite
    // it to a same-origin `/api/...` path so browser receives Set-Cookie headers.
    let url: string;
    const configuredBase = this.config.baseUrl?.replace(/\/$/, '');

    if (/^https?:\/\//i.test(endpoint)) {
      // If endpoint points to the configured backend base, rewrite to same-origin
      // e.g. https://api.example.com/api/auth/status -> /api/auth/status
      if (configuredBase && endpoint.startsWith(configuredBase)) {
        url = endpoint.replace(configuredBase, '');
        if (!url.startsWith('/')) url = `/${url}`;
      } else {
        url = endpoint;
      }
    } else if (endpoint.startsWith('/api/')) {
      url = endpoint;
    } else {
      url = `${this.config.baseUrl}${endpoint}`;
    }
    
    // Create timeout signal
    const timeoutSignal = AbortSignal.timeout(timeout);
    
    // Combine signals if both are provided
    const combinedSignal = signal 
      ? AbortSignal.any([signal, timeoutSignal])
      : timeoutSignal;

    // Default headers with CORS support
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
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
      signal: combinedSignal
    };

    // Add body if provided
    if (body) {
      if (body instanceof FormData) {
        requestConfig.body = body;
      } else {
        requestConfig.body = JSON.stringify(body);
      }
    }

    logger.debug(`🔗 API Client: Making ${method} request to ${url}`);

    // Retry logic
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
  const response = await fetch(url, requestConfig);
        
        logger.debug(`📡 API Client: Response status ${response.status} for ${url}`);
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : this.config.retryDelay;
          
          logger.warn(`⏳ API Client: Rate limited, waiting ${waitTime}ms before retry ${attempt}/${retries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
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

        return {
          data,
          status: response.status,
          ok: response.ok,
          headers: response.headers,
          requestId: responseRequestId
        };

      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
          logger.error(`⏰ API Client: Request timeout for ${url}`);
          throw new Error(`Request timeout after ${timeout}ms`);
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

// Export types for use in other files
export type { ApiResponse, RequestOptions };
