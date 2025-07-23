'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatedMessage } from './AnimatedMessage';

interface NotificationContextType {
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, persistent?: boolean) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  clearAll: () => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  persistent?: boolean;
  duration?: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((
    type: Notification['type'], 
    message: string, 
    persistent = false, 
    duration = 4000
  ) => {
    const id = Date.now().toString();
    const notification: Notification = { id, type, message, persistent, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove non-persistent notifications
    if (!persistent) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showSuccess = useCallback((message: string, duration = 4000) => {
    addNotification('success', message, false, duration);
  }, [addNotification]);

  const showError = useCallback((message: string, persistent = false) => {
    addNotification('error', message, persistent);
  }, [addNotification]);

  const showInfo = useCallback((message: string, duration = 4000) => {
    addNotification('info', message, false, duration);
  }, [addNotification]);

  const showWarning = useCallback((message: string, duration = 4000) => {
    addNotification('warning', message, false, duration);
  }, [addNotification]);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const contextValue: NotificationContextType = {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearAll
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Notification Portal */}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
        {notifications.map((notification) => (
          <AnimatedMessage
            key={notification.id}
            type={notification.type}
            message={notification.message}
            isVisible={true}
            onClose={() => removeNotification(notification.id)}
            autoHide={!notification.persistent}
            duration={notification.duration}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
