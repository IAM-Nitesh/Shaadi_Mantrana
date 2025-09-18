'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuthStatus } from '../../utils/client-auth';
import StandardHeader from '../../components/StandardHeader';
import AdminBottomNavigation from '../../components/AdminBottomNavigation';
import HeartbeatLoader from '../../components/HeartbeatLoader';
import logger from '../../utils/logger';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [retryOnce, setRetryOnce] = useState(false);

  const checkAuthentication = useCallback(async () => {
    try {
      // Skip authentication check for login page
      if (pathname === '/admin/login') {
        setIsChecking(false);
        setIsAuthenticated(true); // Allow access to login page
        return;
      }

  // Check if user is authenticated using server API
      // Force a fresh check to avoid any stale negative cache right after login
      const authStatus = await getAuthStatus(true);
      if (!authStatus.authenticated) {
        // Perform one quick retry to avoid transient unauthenticated state
        if (!retryOnce) {
          setRetryOnce(true);
          const retryStatus = await getAuthStatus(true);
          if (!retryStatus.authenticated) {
            router.replace('/');
            return;
          }
        } else {
          router.replace('/');
          return;
        }
      }

      // Verify admin access
  if (authStatus.user?.role !== 'admin') {
        router.replace('/'); // Redirect to main app if not admin
        return;
      }

      setIsAuthenticated(true);
      
      // Redirect to dashboard if accessing admin root
      if (pathname === '/admin') {
        router.replace('/admin/dashboard');
      }
    } catch (error) {
      logger.error('Admin authentication check failed:', error);
      router.replace('/'); // Redirect to main app on error
    } finally {
      setIsChecking(false);
    }
  }, [pathname, router, retryOnce]);

  useEffect(() => {
    // Reset retry flag on path change to allow a fresh forced check
    setRetryOnce(false);
    checkAuthentication();
  }, [pathname, router, checkAuthentication]);

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <HeartbeatLoader 
          logoSize="xxl"
          textSize="lg"
          text="Checking admin access..."
          showText={true}
        />
      </div>
    );
  }

  // Only render children if authenticated or on login page
  if (isAuthenticated || pathname === '/admin/login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
        {/* Fixed Header - StandardHeader is fixed and uses a consistent height (h-16) */}
        <StandardHeader showProfileLink={false} />

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