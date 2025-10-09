// Authentication Notification Service
// Provides user notifications for authentication events

import logger from '../utils/logger';

export enum NotificationLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success'
}

export interface Notification {
  id: string;
  message: string;
  level: NotificationLevel;
  dismissable: boolean;
  autoHideDuration?: number; // in milliseconds
  action?: {
    label: string;
    callback: () => void;
  };
}

export interface NotificationOptions {
  level?: NotificationLevel;
  dismissable?: boolean;
  autoHideDuration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}

type NotificationCallback = (notification: Notification) => void;
type NotificationClearCallback = (id?: string) => void;

class NotificationService {
  private listeners: NotificationCallback[] = [];
  private clearListeners: NotificationClearCallback[] = [];
  private activeNotifications: Map<string, Notification> = new Map();
  private notificationCounter = 0;
  
  // Subscribe to notifications
  subscribe(callback: NotificationCallback, clearCallback: NotificationClearCallback): () => void {
    this.listeners.push(callback);
    this.clearListeners.push(clearCallback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
      this.clearListeners = this.clearListeners.filter(cb => cb !== clearCallback);
    };
  }
  
  // Show a notification
  show(message: string, options: NotificationOptions = {}): string {
    const id = `notification_${++this.notificationCounter}_${Date.now()}`;
    
    const notification: Notification = {
      id,
      message,
      level: options.level || NotificationLevel.INFO,
      dismissable: options.dismissable !== false,
      autoHideDuration: options.autoHideDuration,
      action: options.action
    };
    
    logger.debug('🔔 NotificationService: Showing notification', notification);
    
    // Store notification
    this.activeNotifications.set(id, notification);
    
    // Notify listeners
    this.listeners.forEach(listener => listener(notification));
    
    // Auto-hide if configured
    if (notification.autoHideDuration) {
      setTimeout(() => {
        this.dismiss(id);
      }, notification.autoHideDuration);
    }
    
    return id;
  }
  
  // Dismiss a notification
  dismiss(id: string): void {
    logger.debug(`🔔 NotificationService: Dismissing notification ${id}`);
    
    if (this.activeNotifications.has(id)) {
      this.activeNotifications.delete(id);
      
      // Notify clear listeners
      this.clearListeners.forEach(listener => listener(id));
    }
  }
  
  // Dismiss all notifications
  dismissAll(): void {
    logger.debug('🔔 NotificationService: Dismissing all notifications');
    this.activeNotifications.clear();
    
    // Notify clear listeners
    this.clearListeners.forEach(listener => listener());
  }
  
  // Convenience methods for different notification types
  info(message: string, options: Omit<NotificationOptions, 'level'> = {}): string {
    return this.show(message, { ...options, level: NotificationLevel.INFO });
  }
  
  warning(message: string, options: Omit<NotificationOptions, 'level'> = {}): string {
    return this.show(message, { ...options, level: NotificationLevel.WARNING });
  }
  
  error(message: string, options: Omit<NotificationOptions, 'level'> = {}): string {
    return this.show(message, { ...options, level: NotificationLevel.ERROR });
  }
  
  success(message: string, options: Omit<NotificationOptions, 'level'> = {}): string {
    return this.show(message, { ...options, level: NotificationLevel.SUCCESS });
  }
  
  // Authentication-specific notifications
  
  // Session expiring soon warning
  showSessionExpiringSoon(expiryTimeMs: number, refreshCallback: () => void): string {
    const minutes = Math.ceil(expiryTimeMs / 60000);
    
    // Calculate auto-hide duration, ensuring it's at least 5000ms (5 seconds)
    // to prevent negative or too short durations for tokens that expire very soon
    const autoHideDuration = Math.max(
      Math.min(expiryTimeMs - 10000, 30000), // Previous calculation
      5000 // Minimum duration of 5 seconds
    );
    
    return this.warning(
      `Your session will expire in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}. Please continue to stay logged in.`,
      {
        dismissable: true,
        autoHideDuration,
        action: {
          label: 'Stay Logged In',
          callback: refreshCallback
        }
      }
    );
  }
  
  // Session expired notification
  showSessionExpired(loginUrl: string = '/login'): string {
    return this.error(
      'Your session has expired. Please log in again to continue.',
      {
        dismissable: true,
        action: {
          label: 'Log In',
          callback: () => {
            window.location.href = loginUrl;
          }
        }
      }
    );
  }
  
  // Authentication service issues
  showAuthServiceIssue(): string {
    return this.error(
      'We\'re having trouble connecting to the authentication service. Your session may be affected.',
      {
        dismissable: true,
        autoHideDuration: 10000
      }
    );
  }
  
  // Authentication recovered notification
  showAuthRecovered(): string {
    return this.success(
      'Connection to the authentication service has been restored.',
      {
        dismissable: true,
        autoHideDuration: 5000
      }
    );
  }
}

// Create a singleton instance
const notificationService = new NotificationService();

export default notificationService;