'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import StandardHeader from '../../components/StandardHeader';
import AdminBottomNavigation from '../../components/AdminBottomNavigation';
import RoyalLoader from '../../components/RoyalLoader';
import logger from '../../utils/logger';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, checkAuth } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  // Handle authentication and admin access checks
  useEffect(() => {
    // Normalize pathname to handle Next.js trailingSlash config
    const cleanPath = pathname.replace(/\/$/, '');
    
    // Skip authentication check for login page
    if (cleanPath === '/admin/login') {
      return;
    }

    logger.debug('🔍 AdminLayout: Checking authentication for admin access', { 
      pathname, 
      isLoading,
      isAuthenticated,
      userRole: user?.role,
      timestamp: new Date().toISOString() 
    });

    // Wait for AuthContext to finish loading
    if (isLoading) {
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      logger.warn('❌ AdminLayout: User not authenticated, redirecting to home');
      setAuthError('Authentication required');
      router.replace('/');
      return;
    }

    // Verify admin access
    if (user.role !== 'admin') {
      logger.warn('❌ AdminLayout: User is not admin', { 
        userRole: user.role, 
        userEmail: user.email 
      });
      setAuthError('Access denied: Admin privileges required');
      router.replace('/'); // Redirect to main app if not admin
      return;
    }

    logger.info('✅ AdminLayout: Admin authentication successful', { 
      userEmail: user.email,
      userRole: user.role 
    });
    
    // Clear any previous auth errors on successful authentication
    setAuthError(null);
    
    // Redirect to users page if accessing admin root
    if (cleanPath === '/admin') {
      router.replace('/admin/users');
    }
  }, [pathname, router, isLoading, isAuthenticated, user]);

  // Show loading while AuthContext is checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-royal-obsidian flex items-center justify-center">
        <div className="text-center">
          <RoyalLoader 
            size="xl"
            text="Checking admin access..."
            showText={true}
            variant="spark"
          />
          {authError && (
            <p className="mt-4 text-red-600 text-sm">{authError}</p>
          )}
        </div>
      </div>
    );
  }

  // Only render children if authenticated and admin, or on login page
  const cleanPath = pathname.replace(/\/$/, '');
  if ((isAuthenticated && user?.role === 'admin') || cleanPath === '/admin/login') {
    return (
      // Use bg on html-level wrapper only — NO overflow-y-auto here.
      // Content scrolls at the body/html level (same as regular user pages)
      // so that position:fixed on AdminBottomNavigation pins to the real viewport.
      <div className="min-h-[100dvh] bg-royal-obsidian">
        {/* Fixed Header */}
        <StandardHeader showProfileLink={false} />

        {/* Page content — naturally scrollable, padded so it clears the fixed header and nav */}
        <div
          className="admin-content"
          style={{
            paddingTop: 'calc(var(--header-height, 4rem) + env(safe-area-inset-top))',
            paddingBottom: 'calc(var(--bottom-nav-height, 5rem) + env(safe-area-inset-bottom) + 0.5rem)',
          }}
        >
          {children}
        </div>

        {/* Fixed bottom nav — rendered at body level scroll context */}
        <AdminBottomNavigation />
      </div>
    );
  }

  // Return null for unauthenticated users (except login page)
  return null;
}