'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function ToasterClient() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        duration: 3000,
        style: {
          background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
          color: '#1f2937',
          borderRadius: '16px',
          padding: '16px 20px',
          fontSize: '14px',
          fontWeight: '500',
          fontFamily: 'Inter, system-ui, sans-serif',
          boxShadow: '0 10px 25px rgba(236, 72, 153, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(236, 72, 153, 0.1)',
          backdropFilter: 'blur(10px)',
          maxWidth: '400px',
          minWidth: '300px',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.3s ease-out',
        },
        success: {
          duration: 5000,
          style: {
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            color: '#065f46',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
          },
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            color: '#991b1b',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            boxShadow: '0 10px 25px rgba(239, 68, 68, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
        },
        loading: {
          style: {
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            color: '#0c4a6e',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
          },
          iconTheme: {
            primary: '#3b82f6',
            secondary: '#ffffff',
          },
        },
        className: 'toast-animation swipeable-toast',
      }}
      containerStyle={{
        top: 20,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
      // @ts-ignore - additional props supported by library
      swipeDirection={['left', 'right']}
      // @ts-ignore - additional props supported by library
      swipeThreshold={50}
    />
  );
}


