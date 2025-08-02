'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useServerAuth } from '../hooks/useServerAuth';
import { ServerAuthService } from '../services/server-auth-service';

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
  console.log('🔍 ServerAuthGuard: Component initialized');
  
  const router = useRouter();
  const { user, isAuthenticated, isLoading, error, redirectTo } = useServerAuth();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [authTimeout, setAuthTimeout] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const timeoutMs = 3000; // 3 seconds timeout for all environments

  // Timeout protection for authentication check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ ServerAuthGuard: Authentication check timeout after 15 seconds');
        setAuthTimeout(true);
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  // Fallback timeout for development mode
  useEffect(() => {
    if (isLoading && !authTimeout && !isAuthenticated) {
      const timer = setTimeout(() => {
        console.log('⏰ ServerAuthGuard: Authentication timeout, showing fallback');
        setShowFallback(true);
      }, timeoutMs);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, authTimeout, isAuthenticated, timeoutMs]);

  useEffect(() => {
    if (!isLoading && !hasRedirected) {
      console.log('🔍 ServerAuthGuard Debug:', {
        isLoading,
        isAuthenticated,
        user,
        redirectTo,
        requireAuth,
        requireAdmin,
        requireCompleteProfile,
        currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        hasRedirected,
        authTimeout
      });

      // Handle timeout case
      if (authTimeout) {
        console.log('🚫 ServerAuthGuard: Authentication timeout, redirecting to login');
        setHasRedirected(true);
        router.push('/?error=timeout');
        return;
      }

      // Handle authentication requirements
      if (requireAuth && !isAuthenticated) {
        console.log('🚫 ServerAuthGuard: User not authenticated, redirecting to login');
        setHasRedirected(true);
        router.push('/');
        return;
      }

      // Handle admin requirements
      if (requireAdmin && !ServerAuthService.isAdmin(user)) {
        console.log('🚫 ServerAuthGuard: User not admin, redirecting');
        setHasRedirected(true);
        router.push(fallbackPath);
        return;
      }

      // Handle profile completion requirements - ONLY for initial login
      if (requireCompleteProfile && ServerAuthService.needsProfileCompletion(user)) {
        const currentPath = window.location.pathname;
        // Only redirect to profile if user is coming from login/root pages
        const isFromLogin = currentPath === '/' || currentPath === '/login' || currentPath === '/auth';
        
        if (isFromLogin) {
          console.log('🚫 ServerAuthGuard: Profile incomplete, redirecting to profile from login');
          console.log('📊 Profile Debug:', {
            isFirstLogin: user?.isFirstLogin,
            profileCompleteness: user?.profileCompleteness,
            needsCompletion: ServerAuthService.needsProfileCompletion(user)
          });
          setHasRedirected(true);
          router.push('/profile');
          return;
        } else {
          console.log('✅ ServerAuthGuard: User already on profile page, not redirecting');
        }
      }

      // Handle server-side redirects - ONLY for initial login
      if (redirectTo && redirectTo !== window.location.pathname) {
        const currentPath = window.location.pathname;
        const shouldRedirect = currentPath === '/' || currentPath === '/login' || currentPath === '/auth';
        
        if (shouldRedirect) {
          console.log(`🔄 ServerAuthGuard: Initial login redirect to ${redirectTo}`);
          setHasRedirected(true);
          router.push(redirectTo);
          return;
        } else {
          console.log(`✅ ServerAuthGuard: User already on valid page ${currentPath}, not redirecting`);
        }
      } else if (redirectTo === null) {
        console.log('✅ ServerAuthGuard: User fully authenticated, no redirects needed');
      }

      // Handle admin user access restrictions
      if (user && user.role === 'admin') {
        const currentPath = window.location.pathname;
        const isUserRoute = currentPath.startsWith('/dashboard') || 
                           currentPath.startsWith('/matches') || 
                           currentPath.startsWith('/profile') || 
                           currentPath.startsWith('/settings');
        
        if (isUserRoute) {
          console.log('🚫 ServerAuthGuard: Admin user trying to access user routes, redirecting to admin dashboard');
          setHasRedirected(true);
          router.push('/admin/dashboard');
          return;
        }
      }

      // Handle onboarding message for users
      if (user && user.role === 'user' && !user.hasSeenOnboardingMessage && user.isFirstLogin) {
        console.log('🎯 ServerAuthGuard: Showing onboarding message for first-time user');
      }

      console.log('✅ ServerAuthGuard: All checks passed, rendering children');
    }
  }, [isLoading, isAuthenticated, user, redirectTo, requireAuth, requireAdmin, requireCompleteProfile, fallbackPath, router, hasRedirected, authTimeout]);

    // Show loading only for initial authentication check, not for subsequent navigation
  if (isLoading && !authTimeout && !isAuthenticated && !showFallback) {
    console.log('🔍 ServerAuthGuard: Showing initial authentication loading state');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm mt-2 mb-6">Please wait while we verify your credentials...</p>
          
          {/* Manual refresh button for stuck users */}
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="bg-white border-2 border-rose-500 text-rose-500 px-6 py-3 rounded-xl font-medium hover:bg-rose-50 transition-all duration-300 shadow-lg"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated and cache is valid, skip loading screen and show content immediately
  if (isAuthenticated && user && !isLoading) {
    console.log('✅ ServerAuthGuard: User authenticated, rendering content immediately');
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
          <p className="text-gray-600 mb-6">Authentication is taking longer than expected. Please try refreshing the page.</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-white border-2 border-yellow-500 text-yellow-500 px-6 py-3 rounded-xl font-medium hover:bg-yellow-50 transition-all duration-300 shadow-lg"
            >
              Refresh Page
            </button>
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
              onClick={() => window.location.reload()}
              className="bg-white border-2 border-blue-500 text-blue-500 px-6 py-3 rounded-xl font-medium hover:bg-blue-50 transition-all duration-300 shadow-lg"
            >
              Try Again
            </button>
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