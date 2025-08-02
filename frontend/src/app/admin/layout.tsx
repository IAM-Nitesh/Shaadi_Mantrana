'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ServerAuthService } from '../../services/server-auth-service';
import StandardHeader from '../../components/StandardHeader';
import AdminBottomNavigation from '../../components/AdminBottomNavigation';
import { gsap } from 'gsap';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, [pathname]);

  const checkAuthentication = async () => {
    try {
      // Skip authentication check for login page
      if (pathname === '/admin/login') {
        setIsChecking(false);
        setIsAuthenticated(true); // Allow access to login page
        return;
      }

      // Check if user is authenticated using server-side auth
      const authStatus = await ServerAuthService.checkAuthStatus();
      if (!authStatus.authenticated) {
        router.replace('/'); // Redirect to main app login
        return;
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
      console.error('Admin authentication check failed:', error);
      router.replace('/'); // Redirect to main app on error
    } finally {
      setIsChecking(false);
    }
  };

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Only render children if authenticated or on login page
  if (isAuthenticated || pathname === '/admin/login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <StandardHeader showProfileLink={false} />
        <main className="pb-20 pt-20 admin-content">
          {children}
        </main>
        <AdminBottomNavigation />
      </div>
    );
  }

  // Return null for unauthenticated users (except login page)
  return null;
} 