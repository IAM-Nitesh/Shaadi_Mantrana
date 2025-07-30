'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import HeartbeatLoader from './HeartbeatLoader';
import { ProfileService } from '../services/profile-service';

interface NavigationGuardProps {
  children: React.ReactNode;
}

export default function NavigationGuard({ children }: NavigationGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin routes - only accessible to admin users
  const adminRoutes = ['/admin', '/admin/dashboard', '/admin/users', '/admin/email-invitations', '/admin/data-safety'];
  
  // Regular user routes - not accessible to admin users
  const userRoutes = ['/dashboard', '/matches', '/chat', '/profile', '/settings', '/help', '/privacy', '/terms'];
  
  // Allowed routes for first-time users
  const allowedRoutes = ['/profile', '/', '/auth', '/login', '/logout'];
  
  // Check if current route is admin route
  const isAdminRoute = (path: string) => {
    return adminRoutes.some(route => path.startsWith(route));
  };

  // Check if current route is user route
  const isUserRoute = (path: string) => {
    return userRoutes.some(route => path.startsWith(route));
  };
  
  // Check if current route is allowed for first-time users
  const isRouteAllowed = (path: string) => {
    return allowedRoutes.some(route => path.startsWith(route));
  };

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        // Check if user is authenticated
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          console.log('🔐 No auth token found, allowing navigation');
          setIsChecking(false);
          return;
        }

        console.log('🔍 Checking user status...');
        
        // Check if user is admin (from localStorage)
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'admin') {
          setIsAdmin(true);
          
          // If admin is on a user route, redirect to admin dashboard
          if (isUserRoute(pathname)) {
            console.log('🚫 Admin user redirected from user route to admin dashboard');
            router.replace('/admin/dashboard');
            setIsChecking(false);
            return;
          }
          
          // If admin is on root or allowed route, redirect to admin dashboard
          if (pathname === '/' || isRouteAllowed(pathname)) {
            console.log('🚫 Admin user redirected to admin dashboard');
            router.replace('/admin/dashboard');
            setIsChecking(false);
            return;
          }
          
          // Admin is on admin route, allow access
          setIsChecking(false);
          return;
        } else {
          setIsAdmin(false);
        }
        
        // Check if user is first-time user (from localStorage)
        const isFirstTimeUser = localStorage.getItem('isFirstTimeUser') === 'true';
        const isFirstLogin = localStorage.getItem('isFirstLogin') === 'true';
        const profileCompletion = ProfileService.getProfileCompletion();
        
        const shouldBeFirstTimeUser = isFirstLogin || profileCompletion < 100;
        setIsFirstTimeUser(shouldBeFirstTimeUser);

        // Redirect if needed (only for non-admin users)
        if (shouldBeFirstTimeUser && !isRouteAllowed(pathname)) {
          console.log('🚫 Navigation blocked: First-time user redirected to profile');
          console.log('📊 Profile completion:', profileCompletion, 'isFirstLogin:', isFirstLogin);
          // Use immediate redirect to prevent any flash
          window.location.href = '/profile';
          return;
        }
      } catch (error) {
        console.error('❌ Error checking user status:', error);
        // On error, allow navigation
        setIsFirstTimeUser(true);
        localStorage.setItem('isFirstTimeUser', 'true');
      } finally {
        setIsChecking(false);
      }
    };

    checkUserStatus();
  }, [pathname, router]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <HeartbeatLoader 
            size="xxl" 
            text="Loading Application" 
            className="mb-4"
          />
        </div>
      </div>
    );
  }

  // If admin user is trying to access user routes, redirect to admin dashboard
  if (isAdmin && isUserRoute(pathname)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-bounce mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-white text-2xl">👨‍💼</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Admin Access Required</h2>
          <p className="text-gray-600 mb-6">
            You are logged in as an administrator. Please use the admin dashboard for system management.
          </p>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Go to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  // If first-time user and trying to access restricted route, redirect
  if (isFirstTimeUser && !isRouteAllowed(pathname)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-bounce mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-white text-2xl">📝</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Complete Your Profile First</h2>
          <p className="text-gray-600 mb-6">
            Please complete 100% of your profile before accessing other features. This helps us provide you with better matches.
          </p>
          <button
            onClick={() => router.push('/profile')}
            className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Go to Profile
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 