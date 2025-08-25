'use client';

import { useEffect } from 'react';

export default function ConsoleSuppressor() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Configure GSAP to suppress warnings
      if (typeof window !== 'undefined' && window.gsap) {
        window.gsap.config({
          nullTargetWarn: false
        });
      }

      // Store original console methods
      const originalWarn = console.warn;
      const originalLog = console.log;
      const originalInfo = console.info;
      const originalError = console.error;

      // Override console.warn
      console.warn = function(...args) {
        const message = args.join(' ');
        
        // Suppress specific development warnings but allow our debug logs
        if (
          message.includes('Download the React DevTools') ||
          message.includes('[Fast Refresh]') ||
          message.includes('HMR') ||
          message.includes('hot-reloader') ||
          message.includes('rebuilding') ||
          message.includes('done in') ||
          message.includes('GSAP target') ||
          message.includes('not found') ||
          message.includes('Invalid property') ||
          message.includes('GSAP') ||
          message.includes('target not found') ||
          message.toLowerCase().includes('gsap') ||
          message.includes('tween target') ||
          message.includes('selector text')
        ) {
          return;
        }
        
        originalWarn.apply(console, args);
      };

      // Override console.error for GSAP errors
      console.error = function(...args) {
        const message = args.join(' ');
        
        if (
          message.includes('GSAP target') ||
          message.includes('not found') ||
          message.includes('Invalid property') ||
          message.includes('GSAP') ||
          message.includes('target not found') ||
          message.toLowerCase().includes('gsap') ||
          message.includes('tween target') ||
          message.includes('selector text')
        ) {
          return;
        }
        
        originalError.apply(console, args);
      };

      // Override console.log for HMR messages but allow our debug logs
      console.log = function(...args) {
        const message = args.join(' ');
        
        // Allow our debug logs (they contain emojis)
        if (message.includes('🔍') || message.includes('✅') || message.includes('❌') || message.includes('🔄')) {
          originalLog.apply(console, args);
          return;
        }
        
        if (
          message.includes('[Fast Refresh]') ||
          message.includes('HMR') ||
          message.includes('hot-reloader') ||
          message.includes('rebuilding') ||
          message.includes('done in') ||
          message.includes('GSAP target') ||
          message.includes('not found')
        ) {
          return;
        }
        
        originalLog.apply(console, args);
      };

      // Override console.info for HMR messages
      console.info = function(...args) {
        const message = args.join(' ');
        
        if (
          message.includes('[Fast Refresh]') ||
          message.includes('HMR') ||
          message.includes('hot-reloader') ||
          message.includes('rebuilding') ||
          message.includes('done in') ||
          message.includes('GSAP target') ||
          message.includes('not found')
        ) {
          return;
        }
        
        originalInfo.apply(console, args);
      };

      // Cleanup function
      return () => {
        console.warn = originalWarn;
        console.log = originalLog;
        console.info = originalInfo;
        console.error = originalError;
      };
    }
  }, []);

  return null;
}
