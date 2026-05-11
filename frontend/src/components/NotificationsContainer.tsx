'use client';
// Authentication Notification Component


import React, { useEffect, useState } from 'react';
import notificationService, { 
  Notification, 
  NotificationLevel 
} from '../services/notification-service';
import '../styles/notification-animations.css';

// Styles for notifications
const notificationStyles = {
  container: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    maxWidth: '400px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  notification: {
    padding: '12px 16px',
    borderRadius: '6px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    animation: 'slideIn 0.3s ease-out',
    backgroundColor: 'white',
    marginBottom: '10px',
    borderLeft: '4px solid #ccc',
  },
  info: {
    borderLeftColor: '#3b82f6', // blue
    backgroundColor: '#eff6ff',
  },
  warning: {
    borderLeftColor: '#f59e0b', // amber
    backgroundColor: '#fffbeb',
  },
  error: {
    borderLeftColor: '#ef4444', // red
    backgroundColor: '#fef2f2',
  },
  success: {
    borderLeftColor: '#10b981', // green
    backgroundColor: '#ecfdf5',
  },
  content: {
    flex: 1,
    padding: '0 10px'
  },
  message: {
    margin: '0',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '1.4',
    color: '#111827',
  },
  action: {
    marginTop: '8px',
  },
  actionButton: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    textDecoration: 'underline',
    color: '#2563eb',
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    color: '#6b7280',
    fontSize: '16px',
  }
};

// Notification component
const NotificationItem: React.FC<{
  notification: Notification;
  onDismiss: (id: string) => void;
}> = ({ notification, onDismiss }) => {
  const getNotificationStyle = () => {
    const baseStyle = {
      ...notificationStyles.notification,
    };
    
    switch (notification.level) {
      case NotificationLevel.INFO:
        return { ...baseStyle, ...notificationStyles.info };
      case NotificationLevel.WARNING:
        return { ...baseStyle, ...notificationStyles.warning };
      case NotificationLevel.ERROR:
        return { ...baseStyle, ...notificationStyles.error };
      case NotificationLevel.SUCCESS:
        return { ...baseStyle, ...notificationStyles.success };
      default:
        return baseStyle;
    }
  };
  
  return (
    <div style={getNotificationStyle()} role="alert">
      <div style={notificationStyles.content}>
        <p style={notificationStyles.message}>{notification.message}</p>
        {notification.action && (
          <div style={notificationStyles.action}>
            <button 
              style={notificationStyles.actionButton}
              onClick={() => {
                notification.action?.callback();
                onDismiss(notification.id);
              }}
            >
              {notification.action.label}
            </button>
          </div>
        )}
      </div>
      {notification.dismissable && (
        <button 
          style={notificationStyles.closeButton}
          onClick={() => onDismiss(notification.id)}
          aria-label="Close notification"
        >
          ×
        </button>
      )}
    </div>
  );
};

// Notifications container component
export const NotificationsContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Subscribe to notifications
    const unsubscribe = notificationService.subscribe(
      (notification) => {
        setNotifications(prev => [...prev, notification]);
      },
      (id) => {
        if (id) {
          setNotifications(prev => prev.filter(n => n.id !== id));
        } else {
          setNotifications([]);
        }
      }
    );
    
    return unsubscribe;
  }, []);
  
  const handleDismiss = (id: string) => {
    notificationService.dismiss(id);
  };
  
  if (notifications.length === 0) {
    return null;
  }
  
  return (
    <div style={notificationStyles.container as React.CSSProperties}>
      {notifications.map((notification) => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
};

export default NotificationsContainer;