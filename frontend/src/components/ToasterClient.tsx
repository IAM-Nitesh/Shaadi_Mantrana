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
          background: 'rgba(18, 18, 18, 0.85)', // royal-obsidian with opacity
          color: '#ffffff',
          borderRadius: '16px',
          padding: '16px 20px',
          fontSize: '14px',
          fontWeight: '500',
          fontFamily: 'Inter, system-ui, sans-serif',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(212, 175, 55, 0.1)',
          border: '1px solid rgba(212, 175, 55, 0.2)', // royal-gold-border
          backdropFilter: 'blur(16px)',
          maxWidth: '400px',
          minWidth: '300px',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.3s ease-out',
        },
        success: {
          duration: 5000,
          style: {
            background: 'rgba(18, 18, 18, 0.9)',
            color: '#D4AF37', // royal-gold
            border: '1px solid rgba(212, 175, 55, 0.4)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(212, 175, 55, 0.15)',
          },
          iconTheme: {
            primary: '#D4AF37',
            secondary: '#121212',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: 'rgba(18, 18, 18, 0.9)',
            color: '#ff6b6b', // light crimson/red for readability
            border: '1px solid rgba(128, 0, 0, 0.4)', // royal-crimson border
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(128, 0, 0, 0.2)',
          },
          iconTheme: {
            primary: '#800000', // royal-crimson
            secondary: '#ffffff',
          },
        },
        loading: {
          style: {
            background: 'rgba(18, 18, 18, 0.9)',
            color: '#F9E29C', // royal-gold-light
            border: '1px solid rgba(212, 175, 55, 0.3)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(212, 175, 55, 0.1)',
          },
          iconTheme: {
            primary: '#D4AF37',
            secondary: '#121212',
          },
        },
        className: 'toast-animation swipeable-toast card-modern',
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


