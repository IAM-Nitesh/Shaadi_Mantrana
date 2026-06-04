'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function ToasterClient() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={10}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(14, 14, 14, 0.92)',
          color: '#F9E29C',
          borderRadius: '20px',
          padding: '14px 18px',
          fontSize: '13.5px',
          fontWeight: '500',
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '0.01em',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.18), 0 0 30px rgba(212,175,55,0.06)',
          border: '1px solid rgba(212, 175, 55, 0.22)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          maxWidth: '360px',
          minWidth: '280px',
          cursor: 'pointer',
          userSelect: 'none',
        },
        success: {
          duration: 4500,
          style: {
            background: 'rgba(14, 14, 14, 0.94)',
            color: '#D4AF37',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.2), 0 0 40px rgba(212,175,55,0.08)',
          },
          iconTheme: {
            primary: '#D4AF37',
            secondary: '#0e0e0e',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: 'rgba(14, 14, 14, 0.94)',
            color: '#ff7070',
            border: '1px solid rgba(200, 50, 50, 0.35)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(200,50,50,0.2), 0 0 30px rgba(200,50,50,0.08)',
          },
          iconTheme: {
            primary: '#c23232',
            secondary: '#ffffff',
          },
        },
        loading: {
          duration: Infinity,
          style: {
            background: 'rgba(14, 14, 14, 0.94)',
            color: '#F9E29C',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.15)',
          },
          iconTheme: {
            primary: '#D4AF37',
            secondary: '#0e0e0e',
          },
        },
      }}
      containerStyle={{
        top: 16,
        zIndex: 99999,
      }}
    />
  );
}
