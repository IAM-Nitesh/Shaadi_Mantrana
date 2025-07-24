'use client';

import { useEffect } from 'react';

export default function ErrorBoundary() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection caught:', event.reason);
      
      // Handle different types of promise rejections
      if (event.reason) {
        // Handle Event objects (like DOM events that get rejected)
        if (event.reason.constructor && event.reason.constructor.name === 'Event') {
          console.warn('DOM Event promise rejection - likely from async event handler or image loading');
          
          // Specifically handle CSS/link loading errors
          if (event.reason.target && event.reason.target.tagName === 'LINK') {
            const linkElement = event.reason.target as HTMLLinkElement;
            console.warn('CSS loading failed for:', linkElement.href);
            
            // Try to provide fallback or retry mechanism
            if (linkElement.href.includes('remixicon')) {
              console.warn('Remix Icons CDN failed - fallback CSS should handle this');
            }
          }
          
          event.preventDefault();
          return;
        }
        
        // Handle empty objects from API calls
        if (typeof event.reason === 'object' && Object.keys(event.reason).length === 0) {
          console.warn('Empty object promise rejection - likely from API call or async operation');
          event.preventDefault();
          return;
        }
        
        // Handle specific DOM element errors
        if (event.reason.target) {
          if (event.reason.target.tagName === 'LINK') {
            const linkElement = event.reason.target as HTMLLinkElement;
            console.warn('External CSS/Font loading error:', linkElement.href);
            
            // Handle CDN failures gracefully
            if (linkElement.href.includes('cdnjs.cloudflare.com') || linkElement.href.includes('remixicon')) {
              console.warn('CDN resource failed to load - using fallback styles');
            }
          } else if (event.reason.target.tagName === 'IMG') {
            console.warn('Image loading error:', event.reason.target.src);
          }
          event.preventDefault();
          return;
        }
        
        // Handle string errors that are actually Event objects
        if (typeof event.reason === 'string' && event.reason.includes('[object Event]')) {
          console.warn('Event object converted to string - likely from async DOM operation');
          event.preventDefault();
          return;
        }
      }
      
      // Prevent the error from showing in the console as unhandled
      event.preventDefault();
      
      // You can add more sophisticated error handling here
      // For example, send to error tracking service
      if (process.env.NODE_ENV === 'development') {
        console.warn('Promise rejection handled gracefully in development mode');
      }
    };

    // Handle unhandled errors - enhanced for CSS loading
    const handleError = (event: ErrorEvent) => {
      console.error('Unhandled Error caught:', event.error);
      
      // Check for specific error types
      if (event.target && (event.target as HTMLLinkElement).tagName === 'LINK') {
        const linkElement = event.target as HTMLLinkElement;
        console.warn('CSS/Font loading error from external source:', linkElement.href);
        
        // Handle Remix Icons CDN failure specifically
        if (linkElement.href && linkElement.href.includes('remixicon')) {
          console.warn('Remix Icons CDN failed - fallback styles should be active');
          
          // Optionally try to load from a different CDN or local fallback
          // This is handled by the fallback CSS we already have
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error handled gracefully in development mode');
      }
    };

    // Special handler for CSS loading errors
    const handleCSSError = () => {
      const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
      linkElements.forEach((link) => {
        const linkElement = link as HTMLLinkElement;
        
        linkElement.addEventListener('error', (e) => {
          console.warn('CSS failed to load:', linkElement.href);
          
          if (linkElement.href.includes('remixicon')) {
            console.warn('Remix Icons CSS failed - fallback should be active');
            // Mark that external icons failed so we can use fallbacks
            document.documentElement.setAttribute('data-icons-fallback', 'true');
          }
          
          // Prevent this from becoming an unhandled promise rejection
          e.preventDefault();
          e.stopPropagation();
        });
        
        linkElement.addEventListener('load', () => {
          if (linkElement.href.includes('remixicon')) {
            document.documentElement.removeAttribute('data-icons-fallback');
          }
        });
      });
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    
    // Set up CSS error handling after a short delay to ensure DOM is ready
    setTimeout(handleCSSError, 100);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null; // This component doesn't render anything
}
