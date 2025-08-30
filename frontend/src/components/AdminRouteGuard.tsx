'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import HeartbeatLoader from './HeartbeatLoader';
import { useServerAuth } from '../hooks/useServerAuth';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export default function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, error } = useServerAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check admin access when authentication state changes
    if (!isLoading && isAuthenticated && user) {
      if (user.role === 'admin') {
        setIsAdmin(true);
      } else {
        // User is authenticated but not admin
        router.replace('/');
      }
    } else if (!isLoading && !isAuthenticated) {
      // User is not authenticated
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <HeartbeatLoader
            logoSize="xxxxl"
            textSize="xl"
            text="Verifying Admin Access"
            className="mb-4"
          />
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-bounce mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-white text-2xl">🚫</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            {error}. You need administrator privileges to access this page.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Only render children if user is authenticated and is admin
  if (isAuthenticated && isAdmin) {
    return <>{children}</>;
  }

  // Don't render anything while redirecting
  return null;
} 