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
    
    // Redirect to dashboard if accessing admin root
    if (cleanPath === '/admin') {
      router.replace('/admin/dashboard');
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
      <div className="min-h-screen bg-royal-obsidian flex flex-col">
        {/* Fixed Header - StandardHeader is fixed and uses a consistent height (h-16) */}
        <StandardHeader showProfileLink={false} title="Admin Dashboard" />

        {/* Scrollable Content Area (padding matches header/footer heights) */}
        <main className="flex-1 overflow-y-auto" style={{ paddingTop: 'var(--header-height)', paddingBottom: 'var(--bottom-nav-height)' }}>
          <div className="admin-content relative">
            {children}
          </div>
        </main>

        {/* Fixed Footer - AdminBottomNavigation is fixed and uses h-20 */}
        <AdminBottomNavigation />
      </div>
    );
  }

  // Return null for unauthenticated users (except login page)
  return null;
}