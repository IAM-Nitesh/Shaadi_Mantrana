'use client';

import React from 'react';
import ReactDOM from 'react-dom';

/**
 * Development Tools Component
 * 
 * Only runs in development mode to expose React and ReactDOM globally
 * for debugging and development purposes.
 * 
 * This allows access to React DevTools and other debugging utilities
 * in the browser console during development.
 */
export default function DevTools() {
  // Only run in development mode
  if (process.env.NODE_ENV === 'development') {
    // Expose React and ReactDOM globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).React = React;
      (window as any).ReactDOM = ReactDOM;
      
      // Optional: Log that DevTools are enabled
      console.log('🔧 DevTools enabled: React and ReactDOM are available globally');
    }
  }

  // This component doesn't render anything
  return null;
}
