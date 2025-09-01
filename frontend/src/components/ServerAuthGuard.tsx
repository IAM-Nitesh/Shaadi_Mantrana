'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useServerAuth } from '../hooks/useServerAuth';
import HeartbeatLoader from './HeartbeatLoader';
import logger from '../utils/logger';

interface ServerAuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireCompleteProfile?: boolean;
  fallbackPath?: string;
}

export default function ServerAuthGuard({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireCompleteProfile = false,
  fallbackPath = '/'
}: ServerAuthGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, error, redirectTo, checkAuth } = useServerAuth();
  
  // Add client-side initialization state to prevent hydration mismatches
  const [isClientInitialized, setIsClientInitialized] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [authTimeout, setAuthTimeout] = useState(false);

  // Initialize client-side state
  useEffect(() => {
    setIsClientInitialized(true);
  }, []);

  // Set up authentication timeout
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading && !isAuthenticated) {
        logger.debug('⏰ ServerAuthGuard: Authentication timeout reached');
        setAuthTimeout(true);
      }
    }, 15000); // 15 seconds timeout

    return () => clearTimeout(timeoutId);
  }, [isLoading, isAuthenticated]);

  // Handle authentication check
  useEffect(() => {
    if (!isClientInitialized) return;

    const performAuthCheck = async () => {
      try {
        await checkAuth();
      } catch (error) {
        logger.error('❌ ServerAuthGuard: Authentication check failed:', error);
        setShowFallback(true);
      }
    };

    if (requireAuth && !isAuthenticated && !isLoading) {
      performAuthCheck();
    }
  }, [isClientInitialized, requireAuth, isAuthenticated, isLoading, checkAuth]);

  // Handle redirects
  useEffect(() => {
    if (!isClientInitialized || hasRedirected) return;

    if (redirectTo && redirectTo !== window.location.pathname) {
      logger.debug(`🔄 ServerAuthGuard: Redirecting to ${redirectTo}`);
      setHasRedirected(true);
      router.push(redirectTo);
      return;
    }

    // Handle admin user access restrictions
    if (user && user.role === 'admin') {
      const currentPath = window.location.pathname;
      const isUserRoute = currentPath.startsWith('/dashboard') || 
                         currentPath.startsWith('/matches') || 
                         currentPath.startsWith('/profile') || 
                         currentPath.startsWith('/settings');
      
      if (isUserRoute) {
        logger.debug('🚫 ServerAuthGuard: Admin user trying to access user routes, redirecting to admin dashboard');
        setHasRedirected(true);
        router.push('/admin/dashboard');
        return;
      }
    }

    // Handle profile completeness requirement
    if (requireCompleteProfile && user && user.profileCompleteness < 100) {
      logger.debug('🚫 ServerAuthGuard: Profile incomplete - redirecting to profile');
      setHasRedirected(true);
      router.push('/profile');
      return;
    }

  }, [isClientInitialized, isAuthenticated, user, redirectTo, requireAuth, requireAdmin, requireCompleteProfile, fallbackPath, router, hasRedirected, authTimeout]);

  // Show loading only for initial authentication check, not for subsequent navigation
  if (!isClientInitialized || (isLoading && !authTimeout && !isAuthenticated && !showFallback)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <HeartbeatLoader 
          logoSize="xxl"
          textSize="lg"
          text="Please wait while we verify your credentials..."
          showText={true}
        />
      </div>
    );
  }

  // If user is authenticated and cache is valid, skip loading screen and show content immediately
  if (isAuthenticated && user && !isLoading) {
    return <>{children}</>;
  }

  // Show timeout error
  if (authTimeout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-yellow-100 border border-yellow-200 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Connection Timeout</h3>
          <p className="text-gray-600 mb-6">Authentication is taking longer than expected. Pull down to refresh or try again later.</p>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/')}
              className="bg-white border-2 border-gray-500 text-gray-500 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all duration-300 shadow-lg"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show error if authentication failed
  if (error && requireAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-100 border border-red-200 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Authentication Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/')}
              className="bg-white border-2 border-rose-500 text-rose-500 px-6 py-3 rounded-xl font-medium hover:bg-rose-50 transition-all duration-300 shadow-lg"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show children if all requirements are met
  return <>{children}</>;
} 