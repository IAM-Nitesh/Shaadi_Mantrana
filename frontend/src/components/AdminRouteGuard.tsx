'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import HeartbeatLoader from './HeartbeatLoader';
import configService from '../services/configService';
import { AuthService } from '../services/auth-service';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export default function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Check if user is authenticated
        if (!AuthService.isAuthenticated()) {
          setError('Authentication required');
          router.replace('/');
          return;
        }

        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Authentication required');
          router.replace('/');
          return;
        }

        // Check if user is admin
        const response = await fetch(`${configService.apiBaseUrl}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          const userRole = userData.profile?.role;
          
          if (userRole === 'admin') {
            setIsAdmin(true);
            localStorage.setItem('userRole', 'admin');
          } else {
            setError('Admin access required');
            router.replace('/');
            return;
          }
        } else {
          setError('Authentication failed');
          router.replace('/');
          return;
        }
      } catch (error) {
        console.error('❌ Error checking admin access:', error);
        setError('Authentication failed');
        router.replace('/');
        return;
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <HeartbeatLoader 
            size="xxl" 
            text="Verifying Admin Access" 
            className="mb-4"
          />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
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

  // If admin, render children
  if (isAdmin) {
    return <>{children}</>;
  }

  // Fallback - should not reach here
  return null;
} 