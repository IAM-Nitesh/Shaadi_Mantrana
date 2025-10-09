// Auth Storage Service
// Provides redundant and resilient storage for authentication data

import logger from '../utils/logger';

type StorageType = 'localStorage' | 'sessionStorage' | 'cookie' | 'memory';

interface StorageOptions {
  expires?: number; // Expiry time in milliseconds from now
  secure?: boolean; // For cookies
  sameSite?: 'strict' | 'lax' | 'none'; // For cookies
  priority?: StorageType[]; // Storage priority order
}

class AuthStorageService {
  private memoryStorage: Map<string, string> = new Map();
  private initialized = false;
  private storageAvailability: Record<StorageType, boolean> = {
    localStorage: false,
    sessionStorage: false,
    cookie: true, // Assume cookies work
    memory: true  // Memory always works
  };

  constructor() {
    // Check storage availability when possible
    if (typeof window !== 'undefined') {
      this.checkStorageAvailability();
      this.initialized = true;
    }
  }

  // Check availability of storage methods
  private checkStorageAvailability(): void {
    try {
      // Check localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('storage_test', 'test');
        localStorage.removeItem('storage_test');
        this.storageAvailability.localStorage = true;
      }
    } catch (e) {
      logger.warn('⚠️ AuthStorageService: localStorage not available');
      this.storageAvailability.localStorage = false;
    }

    try {
      // Check sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('storage_test', 'test');
        sessionStorage.removeItem('storage_test');
        this.storageAvailability.sessionStorage = true;
      }
    } catch (e) {
      logger.warn('⚠️ AuthStorageService: sessionStorage not available');
      this.storageAvailability.sessionStorage = false;
    }
    
    // Check cookie availability
    this.storageAvailability.cookie = typeof document !== 'undefined';
    if (!this.storageAvailability.cookie) {
      logger.warn('⚠️ AuthStorageService: cookies not available (document is undefined)');
    }

    // Log availability
    logger.debug('🔍 AuthStorageService: Storage availability:', this.storageAvailability);
  }

  // Set a value with multiple storage mechanisms for redundancy
  set(key: string, value: any, options: StorageOptions = {}): boolean {
    if (!this.initialized && typeof window !== 'undefined') {
      this.checkStorageAvailability();
      this.initialized = true;
    }

    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    let stored = false;

    // Use priority order if specified, otherwise use default order
    const storageOrder: StorageType[] = options.priority || 
      ['localStorage', 'sessionStorage', 'cookie', 'memory'];

    // Attempt to store in each available storage mechanism based on priority
    for (const storageType of storageOrder) {
      if (this.storageAvailability[storageType]) {
        try {
          this.setInStorage(storageType, key, stringValue, options);
          stored = true;
          logger.debug(`🔍 AuthStorageService: Value stored in ${storageType}`, { key });
        } catch (e) {
          logger.error(`❌ AuthStorageService: Failed to store in ${storageType}:`, e);
        }
      }
    }

    return stored;
  }

  // Get a value with fallback mechanisms
  get(key: string, options: StorageOptions = {}): any {
    if (!this.initialized && typeof window !== 'undefined') {
      this.checkStorageAvailability();
      this.initialized = true;
    }

    // Use priority order if specified, otherwise use default order
    const storageOrder: StorageType[] = options.priority || 
      ['localStorage', 'sessionStorage', 'cookie', 'memory'];

    // Try each storage mechanism in order
    for (const storageType of storageOrder) {
      if (this.storageAvailability[storageType]) {
        try {
          const value = this.getFromStorage(storageType, key);
          if (value !== null) {
            logger.debug(`🔍 AuthStorageService: Value retrieved from ${storageType}`, { key });
            
            // Try to parse JSON, but return the raw string if that fails
            try {
              return JSON.parse(value);
            } catch (e) {
              return value;
            }
          }
        } catch (e) {
          logger.error(`❌ AuthStorageService: Failed to retrieve from ${storageType}:`, e);
        }
      }
    }

    return null;
  }

  // Remove a value from all storage mechanisms
  remove(key: string): void {
    if (!this.initialized && typeof window !== 'undefined') {
      this.checkStorageAvailability();
      this.initialized = true;
    }

    // Remove from all storage types
    if (this.storageAvailability.localStorage) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        logger.error('❌ AuthStorageService: Failed to remove from localStorage:', e);
      }
    }

    if (this.storageAvailability.sessionStorage) {
      try {
        sessionStorage.removeItem(key);
      } catch (e) {
        logger.error('❌ AuthStorageService: Failed to remove from sessionStorage:', e);
      }
    }

    if (this.storageAvailability.cookie) {
      try {
        this.setCookie(key, '', { expires: -1 });
      } catch (e) {
        logger.error('❌ AuthStorageService: Failed to remove from cookies:', e);
      }
    }

    if (this.storageAvailability.memory) {
      this.memoryStorage.delete(key);
    }

    logger.debug('🔍 AuthStorageService: Value removed from all storage mechanisms', { key });
  }

  // Check if a value exists in any storage mechanism
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Set value in a specific storage type
  private setInStorage(type: StorageType, key: string, value: string, options: StorageOptions): void {
    switch (type) {
      case 'localStorage':
        localStorage.setItem(key, value);
        break;
      case 'sessionStorage':
        sessionStorage.setItem(key, value);
        break;
      case 'cookie':
        this.setCookie(key, value, options);
        break;
      case 'memory':
        this.memoryStorage.set(key, value);
        break;
    }
  }

  // Get value from a specific storage type
  private getFromStorage(type: StorageType, key: string): string | null {
    switch (type) {
      case 'localStorage':
        return localStorage.getItem(key);
      case 'sessionStorage':
        return sessionStorage.getItem(key);
      case 'cookie':
        return this.getCookie(key);
      case 'memory':
        return this.memoryStorage.get(key) || null;
      default:
        return null;
    }
  }

  // Set a cookie with options
  private setCookie(key: string, value: string, options: StorageOptions): void {
    // Ensure document is available (we're in browser context)
    if (typeof document === 'undefined') {
      logger.warn('⚠️ AuthStorageService: Cannot set cookie, document is not available');
      return;
    }
    
    const { expires, secure, sameSite } = options;
    
    let cookieString = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    
    if (expires) {
      const expiryDate = new Date(Date.now() + expires);
      cookieString += `; expires=${expiryDate.toUTCString()}`;
    }
    
    if (secure) {
      cookieString += '; secure';
    }
    
    if (sameSite) {
      cookieString += `; samesite=${sameSite}`;
    }
    
    cookieString += '; path=/';
    
    document.cookie = cookieString;
  }

  // Get a cookie by key
  private getCookie(key: string): string | null {
    // Ensure document is available (we're in browser context)
    if (typeof document === 'undefined') {
      logger.warn('⚠️ AuthStorageService: Cannot get cookie, document is not available');
      return null;
    }
    
    if (!document.cookie) return null;
    
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      const encodedKey = encodeURIComponent(key);
      if (cookie.startsWith(encodedKey + '=')) {
        return decodeURIComponent(cookie.substring(encodedKey.length + 1));
      }
    }
    
    return null;
  }
}

// Create a singleton instance
const authStorage = new AuthStorageService();
export default authStorage;