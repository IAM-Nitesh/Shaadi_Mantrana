// Mobile-specific logger that forwards logs to backend
// This file handles logging for mobile client interactions
// IMPORTANT: This module should ONLY be loaded on the client side!

// This code only runs on client side
import { config as configService } from '../services/configService';
import { apiClient } from './api-client';
import authStorage from '../services/auth-storage-service';

// Define the interface for our logger
export interface IMobileLogger {
  init: () => Promise<void>;
  log: (message?: string, data?: any) => void;
  logScreenView: (screenName?: string) => void;
  logUserAction: (action?: string, data?: any) => void;
  logAppEvent: (eventType?: string, data?: any) => void;
  setUserUuid: (uuid?: string) => void;
  flushAllLogs: () => Promise<void>;
  flush: () => Promise<void>;
  info: (message?: string, data?: any) => void;
  debug: (message?: string, data?: any) => void;
  warn: (message?: string, data?: any) => void;
  error: (message?: string, data?: any) => void;
  logUserInteraction: (action?: string, data?: any) => void;
}

// Create SSR-safe logger - check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// SSR stub logger implementation with all methods the hook uses
const stubLogger: IMobileLogger = {
  init: () => Promise.resolve(),
  log: () => {},
  logScreenView: (screenName?: string) => {},
  logUserAction: (action?: string, data?: any) => {},
  logAppEvent: (eventType?: string, data?: any) => {},
  setUserUuid: (uuid?: string) => {},
  flushAllLogs: () => Promise.resolve(),
  flush: () => Promise.resolve(),
  info: (message?: string, data?: any) => {},
  debug: (message?: string, data?: any) => {},
  warn: (message?: string, data?: any) => {},
  error: (message?: string, data?: any) => {},
  logUserInteraction: (action?: string, data?: any) => {}
};

// If we're not in a browser, we'll use the stub logger
// but we'll export it at the end of the file to avoid multiple exports

// Define log levels
const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

class MobileLogger implements IMobileLogger {
  apiKey: string | null;
  userUuid: string | null;
  isInitialized: boolean;
  deviceInfo: Record<string, any>;
  queuedLogs: any[];
  flushInterval: ReturnType<typeof setInterval> | null;
  isFlushing: boolean;
  maxQueueSize: number;
  flushIntervalMs: number;
  lokiClientApiKey: string;

  constructor() {
    this.apiKey = null;
    this.userUuid = null;
    this.isInitialized = false;
    this.deviceInfo = {};
    this.queuedLogs = [];
    this.flushInterval = null;
    this.isFlushing = false;
    this.maxQueueSize = 50;
    this.flushIntervalMs = 10000; // 10 seconds
    
    // Use Grafana Loki credentials from environment variables via configService
    // URL: configService.grafanaLokiUrl (from .env file)
    // User: configService.grafanaLokiUser (from .env file)
    // Password: configService.grafanaLokiPassword (from .env file)
    this.lokiClientApiKey = configService.lokiClientApiKey;
  }

  // Initialize logger with device information
  async init() {
    if (this.isInitialized) return;
    
    // Validate API key presence
    if (!this.lokiClientApiKey) {
      console.error('❌ Mobile Logger: LOKI_CLIENT_API_KEY environment variable is required');
      console.error('   Please set LOKI_CLIENT_API_KEY in your environment configuration');
      this.isInitialized = true; // Mark as initialized to prevent retries
      return;
    }
    
    try {
      // Double check we're running in a browser environment
      // This should never happen with our SSR guard at the top of the file,
      // but we keep it as a safety check
      if (typeof window === 'undefined') {
        console.warn('Mobile logger init called in SSR environment');
        return;
      }
      
      // Short delay to ensure the browser environment is fully initialized
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Extra safety check for Capacitor
      let hasCapacitor = false;
      try {
        hasCapacitor = !!(window?.Capacitor && 
                         typeof window.Capacitor.isNativePlatform === 'function' && 
                         window.Capacitor.isNativePlatform());
      } catch (e) {
        console.warn('Error checking Capacitor:', e);
      }
      
      // Get device info if in mobile environment
      if (hasCapacitor) {
        const { Device } = await import('@capacitor/device');
        const info = await Device.getInfo();
        this.deviceInfo = {
          platform: info.platform,
          osVersion: info.osVersion,
          model: info.model,
          // appVersion: info.appVersion, // Removed because DeviceInfo does not have this property
          isVirtual: info.isVirtual,
          webViewVersion: info.webViewVersion
        };

        // Get battery level for diagnostics
        try {
          const batteryInfo = await Device.getBatteryInfo();
          this.deviceInfo.batteryLevel = batteryInfo.batteryLevel;
          this.deviceInfo.isCharging = batteryInfo.isCharging;
        } catch (e) {
          // Battery info not critical
        }
      }

      // Try to get user UUID from auth storage
      try {
        const user = await this.getCurrentUser();
        if (user && user.userUuid) {
          this.userUuid = user.userUuid;
        }
      } catch (e) {
        // Continue without user UUID
      }

      this.startFlushInterval();
      this.isInitialized = true;

      // Log initialization success
      this.info('Mobile logger initialized', { 
        event: 'mobile_logger_init',
        deviceInfo: this.deviceInfo 
      });
    } catch (e) {
      console.error('Failed to initialize mobile logger:', e);
    }
  }

  // Get current authenticated user
  async getCurrentUser() {
    try {
      const user = authStorage.get('user');
      return user || null;
    } catch (e) {
      return null;
    }
  }

  // Start the interval to regularly flush logs
  startFlushInterval() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  // Stop the flush interval
  stopFlushInterval() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  // Update user UUID when it changes
  setUserUuid(uuid?: string) {
    if (uuid && uuid !== this.userUuid) {
      this.userUuid = uuid;
      this.info('User identified', { 
        event: 'mobile_user_identified',
        user_uuid: uuid 
      });
    }
  }

  // Create a log entry with context
  createLogEntry(
    level: string,
    message: string,
    data: { position?: Record<string, any>; [key: string]: any } = {}
  ) {
    // Don't log if message is empty
    if (!message) return null;

    // Get current position data if available and not already provided
    const position = data.position || {};
    if ('position' in data) {
      delete data.position;
    }

    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: {
        ...data,
        position
      },
      device: this.deviceInfo,
      user_uuid: this.userUuid || 'anonymous',
      client_type: 'mobile',
      platform: this.deviceInfo.platform || 'unknown'
    };
  }

  // Add log to queue
  addToQueue(entry: any) {
    if (!entry) return;
    
    this.queuedLogs.push(entry);
    
    // If queue gets too large, flush immediately
    if (this.queuedLogs.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  // Flush logs to server
  async flush() {
    if (this.isFlushing || this.queuedLogs.length === 0) return;
    
    // Skip if not in browser - should never happen with our SSR guard
    // at the top of the file, but we keep it as a safety check
    if (typeof window === 'undefined') {
      this.queuedLogs = []; // Clear logs since we can't flush in SSR
      return;
    }
    
    this.isFlushing = true;
    
    // Take current batch and clear queue
    const batch = [...this.queuedLogs];
    this.queuedLogs = [];
    
    try {
      // Create an absolute URL for the API endpoint
      // This is critical to prevent URL parsing errors
      const origin = window.location.origin;
      const apiUrl = new URL('/api/logs', origin).href;
      
      console.log(`Sending logs to: ${apiUrl}`);
      
      const response = await apiClient.post(apiUrl, batch, {
        headers: {
          'X-Client-Log-Key': this.lokiClientApiKey,
          'X-User-UUID': this.userUuid || 'anonymous',
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      if (!response.ok) {
        console.warn('Failed to send logs to server:', response.status, response.data);
        // Put back failed logs at the beginning of the queue
        this.queuedLogs = [...batch, ...this.queuedLogs].slice(0, this.maxQueueSize);
      }
    } catch (error) {
      console.error('Error sending logs to server:', error);
      // Put back failed logs at the beginning of the queue
      this.queuedLogs = [...batch, ...this.queuedLogs].slice(0, this.maxQueueSize);
    } finally {
      this.isFlushing = false;
    }
  }

  // Log methods
  debug(message?: string, data: any = {}) {
    if (!message) return;
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, data);
    if (!entry) return;
    
    console.debug(message, data);
    this.addToQueue(entry);
  }

  info(message?: string, data: any = {}) {
    if (!message) return;
    
    const entry = this.createLogEntry(LogLevel.INFO, message, data);
    if (!entry) return;
    
    console.info(message, data);
    this.addToQueue(entry);
  }

  warn(message?: string, data: any = {}) {
    if (!message) return;
    
    const entry = this.createLogEntry(LogLevel.WARN, message, data);
    if (!entry) return;
    
    console.warn(message, data);
    this.addToQueue(entry);
  }

  error(
    message?: string,
    data: { error?: unknown; [key: string]: any } = {}
  ) {
    if (!message) return;
    
    // If error is an Error object, extract message and stack
    if (data.error instanceof Error) {
      data.errorMessage = data.error.message;
      data.errorStack = data.error.stack;
      data.error = String(data.error);
    }
    
    const entry = this.createLogEntry(LogLevel.ERROR, message, data);
    if (!entry) return;
    
    console.error(message, data);
    this.addToQueue(entry);
  }

  // Log user interaction events
  logUserInteraction(action?: string, data: any = {}) {
    if (!action) return;
    
    this.info(`User action: ${action}`, {
      ...data,
      event: 'mobile_user_interaction',
      action
    });
  }

  // Log screen views
  logScreenView(screenName?: string, data: any = {}) {
    if (!screenName) return;
    
    this.info(`Screen view: ${screenName}`, {
      ...data,
      event: 'mobile_screen_view',
      screenName
    });
  }

  // Log app lifecycle events
  logAppEvent(eventType?: string, data: any = {}) {
    if (!eventType) return;
    
    this.info(`App event: ${eventType}`, {
      ...data,
      event: 'mobile_app_event',
      eventType
    });
  }

  // Ensure logs are flushed before app is closed or put in background
  async flushAllLogs() {
    try {
      await this.flush();
    } catch (e) {
      console.error('Error flushing logs on app close:', e);
    }
  }
  
  // Generic log method - maps to info by default
  log(message?: string, data: any = {}) {
    if (message) {
      this.info(message, data);
    }
  }

  // Alias for logUserInteraction for interface compatibility
  logUserAction(action?: string, data: any = {}) {
    if (action) {
      this.logUserInteraction(action, data);
    }
  }
}

// Create the appropriate logger instance based on environment
// In browser, use the real implementation; otherwise, use the stub
const mobileLogger: IMobileLogger = isBrowser ? new MobileLogger() : stubLogger;

// We don't do any initialization during the module load phase
// This ensures no errors occur during SSR
// All initialization is deferred to explicit calls made by client components

// Export a single instance that is either the real logger or the stub
export default mobileLogger;