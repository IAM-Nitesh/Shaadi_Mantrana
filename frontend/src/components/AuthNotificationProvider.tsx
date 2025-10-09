// AuthNotificationProvider.tsx
// Adds authentication notifications to the application
'use client';

import React from 'react';
import { useAuthNotifications } from '../hooks/useAuthNotifications';
import NotificationsContainer from './NotificationsContainer';

export const AuthNotificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // Use the hook to connect auth state to notifications
  useAuthNotifications();
  
  return (
    <>
      {children}
      <NotificationsContainer />
    </>
  );
};

export default AuthNotificationProvider;