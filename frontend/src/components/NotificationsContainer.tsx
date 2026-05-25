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
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 10px rgba(212, 175, 55, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    animation: 'slideIn 0.3s ease-out',
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    marginBottom: '10px',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    borderLeft: '4px solid rgba(212, 175, 55, 0.4)',
    backdropFilter: 'blur(12px)',
  },
  info: {
    borderLeftColor: '#D4AF37', // royal-gold
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  warning: {
    borderLeftColor: '#F9E29C', // royal-gold-light
    backgroundColor: 'rgba(249, 226, 156, 0.1)',
  },
  error: {
    borderLeftColor: '#800000', // royal-crimson
    backgroundColor: 'rgba(128, 0, 0, 0.15)',
  },
  success: {
    borderLeftColor: '#D4AF37', // royal-gold
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
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
    color: '#F9E29C', // royal-gold-light
    fontFamily: 'Inter, system-ui, sans-serif',
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
    color: '#D4AF37', // royal-gold
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
    color: '#D4AF37', // royal-gold
    fontSize: '20px',
    opacity: 0.8,
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